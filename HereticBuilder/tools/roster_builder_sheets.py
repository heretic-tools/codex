from roster_builder_utils import dict_row, plain_text


class RosterSheetsMixin:
    SHEETS_DEFAULT_LIMIT = 100
    SHEETS_MAX_LIMIT = 500

    def sheets_home(self):
        with self.connect(readonly=True) as conn:
            core = self._core_publication(conn)
            core_counts = self._core_counts(conn, core["id"] if core else None)
            faction_count = self._count(
                conn,
                """
                select count(distinct fk.id)
                from faction_keyword fk
                where fk.excludedFromArmyBuilder = 0
                  and exists (
                    select 1
                    from publication p
                    where p.factionKeywordId = fk.id
                      and p.isCombatPatrol = 0
                  )
                """,
            )
        return {
            "database": self.db_path.name,
            "sections": [
                {
                    "id": "core",
                    "name": "Core Rules",
                    "publicationId": core["id"] if core else None,
                    "counts": core_counts,
                },
                {
                    "id": "army-rules",
                    "name": "Army Rules",
                    "counts": {"factions": faction_count},
                },
            ],
        }

    def sheets_core(self):
        with self.connect(readonly=True) as conn:
            core = self._core_publication(conn)
            if not core:
                return {
                    "publication": None,
                    "sections": [],
                    "ruleSections": [],
                    "counts": self._core_counts(conn, None),
                }
            counts = self._core_counts(conn, core["id"])
            return {
                "publication": core,
                "sections": [
                    {"id": "rules", "name": "Rules", "count": counts["ruleSections"]},
                    {"id": "stratagems", "name": "Stratagems", "count": counts["stratagems"]},
                    {"id": "faqs", "name": "FAQ", "count": counts["faqs"]},
                ],
                "ruleSections": self._rule_sections(conn, core["id"], None),
                "counts": counts,
            }

    def sheets_core_stratagems(self, q="", limit=None):
        with self.connect(readonly=True) as conn:
            core = self._core_publication(conn)
            if not core:
                return {"publication": None, "stratagems": [], "count": 0}
            rows = self._stratagem_rows(
                conn,
                publication_id=core["id"],
                q=q,
                limit=limit,
            )
        return {
            "publication": core,
            "stratagems": rows,
            "count": len(rows),
            "limit": self._limit(limit),
        }

    def sheets_core_faqs(self, q="", limit=None):
        with self.connect(readonly=True) as conn:
            core = self._core_publication(conn)
            if not core:
                return {"publication": None, "faqs": [], "count": 0}
            rows = self._faq_rows(conn, publication_id=core["id"], q=q, limit=limit)
        return {
            "publication": core,
            "faqs": rows,
            "count": len(rows),
            "limit": self._limit(limit),
        }

    def sheets_factions(self, q="", limit=None):
        where = [
            "fk.excludedFromArmyBuilder = 0",
            """
            exists (
              select 1
              from publication p
              where p.factionKeywordId = fk.id
                and p.isCombatPatrol = 0
            )
            """,
        ]
        params = []
        if q:
            where.append("(fk.name like ? or fk.commonName like ?)")
            params.extend([self._like(q), self._like(q)])
        params.append(self._limit(limit))
        with self.connect(readonly=True) as conn:
            rows = conn.execute(
                f"""
                select fk.id, fk.name, fk.commonName, fk.parentFactionKeywordId,
                       parent.name as parentFactionName,
                       (
                         select count(*)
                         from publication p
                         where p.factionKeywordId = fk.id
                           and p.isCombatPatrol = 0
                       ) as publicationCount,
                       (
                         select count(distinct d.id)
                         from datasheet d
                         join datasheet_faction_keyword dfk on dfk.datasheetId = d.id
                         where dfk.factionKeywordId = fk.id
                       ) as datasheetCount,
                       (
                         select count(distinct det.id)
                         from detachment det
                         join detachment_faction_keyword dfk on dfk.detachmentId = det.id
                         where dfk.factionKeywordId = fk.id
                           and det.isCombatPatrol = 0
                       ) as detachmentCount,
                       (
                         select count(distinct f.id)
                         from faq f
                         join publication p on p.id = f.publicationId
                         where p.factionKeywordId = fk.id
                           and p.isCombatPatrol = 0
                       ) as faqCount
                from faction_keyword fk
                left join faction_keyword parent on parent.id = fk.parentFactionKeywordId
                where {" and ".join(where)}
                order by lower(coalesce(fk.commonName, fk.name)), lower(fk.name)
                limit ?
                """,
                params,
            ).fetchall()
        factions = [dict_row(row) for row in rows]
        return {"factions": factions, "count": len(factions), "limit": self._limit(limit)}

    def sheets_faction(self, faction_id):
        with self.connect(readonly=True) as conn:
            faction = self._faction_row(conn, faction_id)
            counts = self._faction_counts(conn, faction_id)
            publications = self._publication_rows(conn, faction_id, include_combat_patrol=False)
        return {
            "faction": faction,
            "sections": [
                {"id": "army-rules", "name": "Army Rules", "count": counts["armyRules"]},
                {"id": "datasheets", "name": "Datasheets", "count": counts["datasheets"]},
                {"id": "detachments", "name": "Detachments", "count": counts["detachments"]},
                {"id": "stratagems", "name": "Stratagems", "count": counts["stratagems"]},
                {"id": "enhancements", "name": "Enhancements", "count": counts["enhancements"]},
                {"id": "faqs", "name": "FAQ", "count": counts["faqs"]},
            ],
            "publications": publications,
            "counts": counts,
        }

    def sheets_publications(self, faction_id, include_combat_patrol=False):
        with self.connect(readonly=True) as conn:
            faction = self._faction_row(conn, faction_id)
            publications = self._publication_rows(conn, faction_id, include_combat_patrol)
        return {
            "faction": faction,
            "publications": publications,
            "count": len(publications),
        }

    def sheets_publication(self, publication_id):
        with self.connect(readonly=True) as conn:
            publication = self._publication_row(conn, publication_id)
            counts = self._publication_counts(conn, publication_id)
            rule_sections = self._rule_sections(conn, publication_id, None)
        return {
            "publication": publication,
            "ruleSections": rule_sections,
            "counts": counts,
        }

    def sheets_rule_sections(self, publication_id=None, parent_id=None):
        with self.connect(readonly=True) as conn:
            if publication_id is None and parent_id is None:
                core = self._core_publication(conn)
                publication_id = core["id"] if core else None
            publication = self._publication_row(conn, publication_id) if publication_id else None
            parent = self._rule_section_row(conn, parent_id) if parent_id else None
            sections = self._rule_sections(conn, publication_id, parent_id)
        return {
            "publication": publication,
            "parent": parent,
            "ruleSections": sections,
            "count": len(sections),
        }

    def sheets_rule_section(self, section_id):
        with self.connect(readonly=True) as conn:
            section = self._rule_section_row(conn, section_id)
            child_sections = self._rule_sections(conn, None, section_id)
            rows = conn.execute(
                """
                select rc.id, rc.containerType, rc.title, rc.subtitle,
                       rc.ruleSectionId, rc.stratagemId, rc.displayOrder,
                       rc.behaviourTypeId, bt.name as behaviourTypeName,
                       (
                         select count(*)
                         from rule_container_component rcc
                         where rcc.ruleContainerId = rc.id
                       ) as componentCount
                from rule_container rc
                left join behaviour_type bt on bt.id = rc.behaviourTypeId
                where rc.ruleSectionId = ?
                order by rc.displayOrder, lower(rc.title)
                """,
                [section_id],
            ).fetchall()
        return {
            "ruleSection": section,
            "childSections": child_sections,
            "ruleContainers": [dict_row(row) for row in rows],
        }

    def sheets_rule_container(self, container_id):
        with self.connect(readonly=True) as conn:
            row = conn.execute(
                """
                select rc.id, rc.containerType, rc.title, rc.subtitle,
                       rc.ruleSectionId, rs.name as ruleSectionName,
                       rs.publicationId, p.name as publicationName,
                       rc.stratagemId, s.name as stratagemName,
                       rc.displayOrder, rc.behaviourTypeId,
                       bt.name as behaviourTypeName, bt.type as behaviourType
                from rule_container rc
                left join rule_section rs on rs.id = rc.ruleSectionId
                left join publication p on p.id = rs.publicationId
                left join stratagem s on s.id = rc.stratagemId
                left join behaviour_type bt on bt.id = rc.behaviourTypeId
                where rc.id = ?
                """,
                [container_id],
            ).fetchone()
            if not row:
                raise ValueError("Rule container not found")
            container = dict_row(row)
            components = self._components_for_rule_container(conn, container_id)
            faqs = self._faq_rows(conn, rule_container_id=container_id)
        return {"ruleContainer": container, "components": components, "faqs": faqs}

    def sheets_army_rules(self, faction_id=None, publication_id=None, q="", limit=None):
        if not faction_id and not publication_id:
            raise ValueError("faction_id or publication_id is required")
        where = []
        params = []
        faction = None
        with self.connect(readonly=True) as conn:
            if faction_id:
                faction = self._faction_row(conn, faction_id)
                where.append(
                    """
                    (
                      p.factionKeywordId = ?
                      or exists (
                        select 1
                        from army_rule_faction_keyword arfk
                        where arfk.armyRuleId = ar.id
                          and arfk.factionKeywordId = ?
                      )
                    )
                    """
                )
                params.extend([faction_id, faction_id])
            if publication_id:
                self._publication_row(conn, publication_id)
                where.append("ar.publicationId = ?")
                params.append(publication_id)
            if q:
                where.append("ar.name like ?")
                params.append(self._like(q))
            params.append(self._limit(limit))
            rows = conn.execute(
                f"""
                select distinct ar.id, ar.name, ar.publicationId,
                       p.name as publicationName, p.factionKeywordId,
                       ar.displayOrder, ar.hiddenFromCommandBunker,
                       (
                         select count(*)
                         from rule_container_component rcc
                         where rcc.armyRuleId = ar.id
                       ) as componentCount,
                       (
                         select count(*)
                         from datasheet_ability da
                         where da.armyRuleId = ar.id
                       ) as linkedAbilityCount,
                       (
                         select count(*)
                         from faq_config fc
                         where fc.armyRuleId = ar.id
                       ) as faqCount
                from army_rule ar
                join publication p on p.id = ar.publicationId
                where {" and ".join(where)}
                  and p.isCombatPatrol = 0
                order by p.displayOrder, ar.displayOrder, lower(ar.name)
                limit ?
                """,
                params,
            ).fetchall()
        army_rules = [dict_row(row) for row in rows]
        return {
            "faction": faction,
            "publicationId": publication_id,
            "armyRules": army_rules,
            "count": len(army_rules),
            "limit": self._limit(limit),
        }

    def sheets_army_rule(self, army_rule_id):
        with self.connect(readonly=True) as conn:
            row = conn.execute(
                """
                select ar.id, ar.name, ar.publicationId, p.name as publicationName,
                       p.factionKeywordId, fk.name as factionName,
                       ar.displayOrder, ar.hiddenFromCommandBunker
                from army_rule ar
                join publication p on p.id = ar.publicationId
                left join faction_keyword fk on fk.id = p.factionKeywordId
                where ar.id = ?
                """,
                [army_rule_id],
            ).fetchone()
            if not row:
                raise ValueError("Army rule not found")
            army_rule = dict_row(row)
            components = self._components_for_army_rule(conn, army_rule_id)
            abilities = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select id, name, abilityType, rules, lore, isPsychic, isAura,
                           isBondsman, subAbilityHeader, isPain
                    from datasheet_ability
                    where armyRuleId = ?
                    order by lower(name)
                    """,
                    [army_rule_id],
                )
            ]
            behaviour_types = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select bt.id, bt.name, bt.type, bt.ruleReference, bt.eligibleIf,
                           bt.effect, arbt.displayOrder
                    from army_rule_behaviour_type arbt
                    join behaviour_type bt on bt.id = arbt.behaviourTypeId
                    where arbt.armyRuleId = ?
                    order by arbt.displayOrder, lower(bt.name)
                    """,
                    [army_rule_id],
                )
            ]
            faqs = self._faq_rows(conn, army_rule_id=army_rule_id)
        return {
            "armyRule": army_rule,
            "components": components,
            "abilities": abilities,
            "behaviourTypes": behaviour_types,
            "faqs": faqs,
        }

    def sheets_datasheets(
        self,
        faction_id,
        publication_id=None,
        q="",
        limit=None,
        include_combat_patrol=False,
    ):
        where = ["dfk.factionKeywordId = ?"]
        params = [faction_id]
        if publication_id:
            where.append("d.publicationId = ?")
            params.append(publication_id)
        if not include_combat_patrol:
            where.append("p.isCombatPatrol = 0")
        if q:
            where.append("(d.name like ? or d.unitComposition like ?)")
            params.extend([self._like(q), self._like(q)])
        params.append(self._limit(limit))
        with self.connect(readonly=True) as conn:
            faction = self._faction_row(conn, faction_id)
            if publication_id:
                self._publication_row(conn, publication_id)
            rows = conn.execute(
                f"""
                select distinct d.id, d.name, d.baseSize, d.maxModelCount,
                       d.publicationId, p.name as publicationName,
                       d.bannerImage, d.rowImage, d.displayOrder,
                       (
                         select uc.points
                         from unit_composition uc
                         where uc.datasheetId = d.id
                         order by uc.isDefault desc, uc.displayOrder
                         limit 1
                       ) as points,
                       (
                         select count(*)
                         from miniature m
                         where m.datasheetId = d.id
                       ) as miniatureCount,
                       (
                         select count(*)
                         from datasheet_rule dr
                         where dr.datasheetId = d.id
                       ) as ruleCount,
                       (
                         select count(*)
                         from datasheet_datasheet_ability dda
                         where dda.datasheetId = d.id
                       ) as abilityCount,
                       d.unitComposition
                from datasheet d
                join publication p on p.id = d.publicationId
                join datasheet_faction_keyword dfk on dfk.datasheetId = d.id
                where {" and ".join(where)}
                order by p.displayOrder, d.displayOrder, lower(d.name)
                limit ?
                """,
                params,
            ).fetchall()
        datasheets = []
        for row in rows:
            item = dict_row(row)
            item["unitComposition"] = self._preview(item["unitComposition"], 220)
            datasheets.append(item)
        return {
            "faction": faction,
            "publicationId": publication_id,
            "datasheets": datasheets,
            "count": len(datasheets),
            "limit": self._limit(limit),
        }

    def sheets_datasheet(self, datasheet_id):
        with self.connect(readonly=True) as conn:
            row = conn.execute(
                """
                select d.id, d.name, d.bannerImage, d.rowImage, d.unitComposition,
                       d.publicationId, p.name as publicationName,
                       p.factionKeywordId, fk.name as publicationFactionName,
                       d.maxModelCount, d.allegianceAbilityGroupId,
                       aag.name as allegianceAbilityGroupName,
                       d.displayOrder, d.isSuccessorChapter, d.isFreeFromEntitlements,
                       d.lore, d.baseSize
                from datasheet d
                join publication p on p.id = d.publicationId
                left join faction_keyword fk on fk.id = p.factionKeywordId
                left join allegiance_ability_group aag on aag.id = d.allegianceAbilityGroupId
                where d.id = ?
                """,
                [datasheet_id],
            ).fetchone()
            if not row:
                raise ValueError("Datasheet not found")
            datasheet = dict_row(row)
            factions = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select fk.id, fk.name, fk.commonName, dfk.displayOrder
                    from datasheet_faction_keyword dfk
                    join faction_keyword fk on fk.id = dfk.factionKeywordId
                    where dfk.datasheetId = ?
                    order by dfk.displayOrder, lower(fk.name)
                    """,
                    [datasheet_id],
                )
            ]
            miniatures = self._datasheet_miniatures(conn, datasheet_id)
            invulnerable_saves = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select inv.id, inv.rules, inv.datasheetId, inv.miniatureId,
                           m.name as miniatureName, inv.save, inv.meleeSave, inv.rangedSave
                    from invulnerable_save inv
                    left join miniature m on m.id = inv.miniatureId
                    where inv.datasheetId = ?
                    order by m.displayOrder, inv.id
                    """,
                    [datasheet_id],
                )
            ]
            unit_compositions = self._unit_compositions(conn, datasheet_id)
            abilities = self._datasheet_abilities(conn, datasheet_id)
            rules = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select id, name, rules, image, displayOrder
                    from datasheet_rule
                    where datasheetId = ?
                    order by displayOrder, lower(name)
                    """,
                    [datasheet_id],
                )
            ]
            damage = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select id, name, damagedAt, rules, displayOrder
                    from datasheet_damage
                    where datasheetId = ?
                    order by displayOrder, lower(name)
                    """,
                    [datasheet_id],
                )
            ]
            points_steps = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select id, stepAt, stepPoints
                    from datasheet_points_step
                    where datasheetId = ?
                    order by stepAt, stepPoints
                    """,
                    [datasheet_id],
                )
            ]
            wargear_options = self._datasheet_wargear_options(conn, datasheet_id)
            wargear_profiles = self._datasheet_wargear_profiles(conn, datasheet_id)
            keywords = self._datasheet_keywords(conn, datasheet_id)
            faqs = self._faq_rows(conn, datasheet_id=datasheet_id)
        return {
            "datasheet": datasheet,
            "factions": factions,
            "miniatures": miniatures,
            "invulnerableSaves": invulnerable_saves,
            "unitCompositions": unit_compositions,
            "pointsSteps": points_steps,
            "abilities": abilities,
            "rules": rules,
            "damage": damage,
            "wargearOptions": wargear_options,
            "wargearProfiles": wargear_profiles,
            "keywords": keywords,
            "faqs": faqs,
        }

    def sheets_detachments(
        self,
        faction_id,
        publication_id=None,
        include_combat_patrol=False,
        q="",
        limit=None,
    ):
        where = ["dfk.factionKeywordId = ?"]
        params = [faction_id, faction_id]
        if publication_id:
            where.append("d.publicationId = ?")
            params.append(publication_id)
        if not include_combat_patrol:
            where.append("d.isCombatPatrol = 0")
            where.append("p.isCombatPatrol = 0")
        if q:
            where.append("d.name like ?")
            params.append(self._like(q))
        params.append(self._limit(limit))
        with self.connect(readonly=True) as conn:
            faction = self._faction_row(conn, faction_id)
            if publication_id:
                self._publication_row(conn, publication_id)
            rows = conn.execute(
                f"""
                select distinct d.id, d.name, d.publicationId, p.name as publicationName,
                       d.bannerImage, d.rowImage, d.displayOrder, d.isCombatPatrol,
                       coalesce(dfdpc.detachmentPointsCost, d.detachmentPointsCost) as detachmentPointsCost,
                       (
                         select count(*)
                         from detachment_rule dr
                         where dr.detachmentId = d.id
                       ) as ruleCount,
                       (
                         select count(*)
                         from enhancement e
                         where e.detachmentId = d.id
                       ) as enhancementCount,
                       (
                         select count(*)
                         from stratagem s
                         where s.detachmentId = d.id
                       ) as stratagemCount
                from detachment d
                join publication p on p.id = d.publicationId
                join detachment_faction_keyword dfk on dfk.detachmentId = d.id
                left join detachment_faction_detachment_points_cost dfdpc
                  on dfdpc.detachmentId = d.id and dfdpc.factionKeywordId = ?
                where {" and ".join(where)}
                order by d.isCombatPatrol, p.displayOrder, d.displayOrder, lower(d.name)
                limit ?
                """,
                params,
            ).fetchall()
        detachments = [dict_row(row) for row in rows]
        return {
            "faction": faction,
            "publicationId": publication_id,
            "detachments": detachments,
            "count": len(detachments),
            "limit": self._limit(limit),
        }

    def sheets_detachment(self, detachment_id):
        with self.connect(readonly=True) as conn:
            row = conn.execute(
                """
                select d.id, d.name, d.publicationId, p.name as publicationName,
                       p.factionKeywordId, fk.name as publicationFactionName,
                       d.bannerImage, d.rowImage, d.displayOrder,
                       d.isFreeFromEntitlements, d.detachmentPointsCost, d.isCombatPatrol
                from detachment d
                join publication p on p.id = d.publicationId
                left join faction_keyword fk on fk.id = p.factionKeywordId
                where d.id = ?
                """,
                [detachment_id],
            ).fetchone()
            if not row:
                raise ValueError("Detachment not found")
            detachment = dict_row(row)
            factions = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select fk.id, fk.name, fk.commonName,
                           coalesce(dfdpc.detachmentPointsCost, d.detachmentPointsCost) as detachmentPointsCost
                    from detachment_faction_keyword dfk
                    join faction_keyword fk on fk.id = dfk.factionKeywordId
                    join detachment d on d.id = dfk.detachmentId
                    left join detachment_faction_detachment_points_cost dfdpc
                      on dfdpc.detachmentId = d.id and dfdpc.factionKeywordId = fk.id
                    where dfk.detachmentId = ?
                    order by lower(fk.name)
                    """,
                    [detachment_id],
                )
            ]
            details = self._detachment_details(conn, detachment_id)
            rules = self._detachment_rules(conn, detachment_id)
            enhancements = self._enhancement_rows(conn, detachment_id=detachment_id)
            stratagems = self._stratagem_rows(conn, detachment_id=detachment_id)
            required_datasheets = self._detachment_datasheet_links(
                conn,
                "detachment_required_datasheet",
                detachment_id,
            )
            excluded_datasheets = self._detachment_datasheet_links(
                conn,
                "detachment_excluded_datasheet",
                detachment_id,
            )
            linked_datasheets = self._detachment_linked_datasheets(conn, detachment_id)
            mandatory_warlords = self._detachment_miniature_links(
                conn,
                "detachment_mandatory_warlord_miniature",
                detachment_id,
            )
            granted_warlords = self._detachment_miniature_links(
                conn,
                "detachment_granted_warlord_miniature",
                detachment_id,
            )
            faqs = self._faq_rows(conn, detachment_id=detachment_id)
        return {
            "detachment": detachment,
            "factions": factions,
            "details": details,
            "rules": rules,
            "enhancements": enhancements,
            "stratagems": stratagems,
            "requiredDatasheets": required_datasheets,
            "excludedDatasheets": excluded_datasheets,
            "linkedDatasheets": linked_datasheets,
            "mandatoryWarlordMiniatures": mandatory_warlords,
            "grantedWarlordMiniatures": granted_warlords,
            "faqs": faqs,
        }

    def sheets_stratagems(
        self,
        faction_id=None,
        publication_id=None,
        detachment_id=None,
        q="",
        limit=None,
        include_combat_patrol=False,
    ):
        with self.connect(readonly=True) as conn:
            faction = self._faction_row(conn, faction_id) if faction_id else None
            if publication_id:
                publication = self._publication_row(conn, publication_id)
            elif not faction_id and not detachment_id:
                publication = self._core_publication(conn)
                publication_id = publication["id"] if publication else None
            else:
                publication = None
            detachment = self._detachment_row(conn, detachment_id) if detachment_id else None
            rows = self._stratagem_rows(
                conn,
                faction_id=faction_id,
                publication_id=publication_id,
                detachment_id=detachment_id,
                q=q,
                limit=limit,
                include_combat_patrol=include_combat_patrol,
            )
        return {
            "faction": faction,
            "publication": publication,
            "detachment": detachment,
            "stratagems": rows,
            "count": len(rows),
            "limit": self._limit(limit),
        }

    def sheets_stratagem(self, stratagem_id):
        with self.connect(readonly=True) as conn:
            row = conn.execute(
                """
                select s.id, s.name, s.lore, s.whenRules, s.targetRules,
                       s.effectRules, s.restrictionRules, s.cpCost, s.key,
                       s.detachmentId, d.name as detachmentName,
                       s.publicationId, p.name as publicationName,
                       p.factionKeywordId, fk.name as factionName,
                       s.displayOrder, s.category,
                       s.secondaryEffectAdditionalCPCost,
                       s.secondaryEffectIsMutuallyExclusive,
                       s.secondaryEffect
                from stratagem s
                join publication p on p.id = s.publicationId
                left join faction_keyword fk on fk.id = p.factionKeywordId
                left join detachment d on d.id = s.detachmentId
                where s.id = ?
                """,
                [stratagem_id],
            ).fetchone()
            if not row:
                raise ValueError("Stratagem not found")
            stratagem = dict_row(row)
            containers = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select id, containerType, title, subtitle, ruleSectionId,
                           stratagemId, displayOrder, behaviourTypeId
                    from rule_container
                    where stratagemId = ?
                    order by displayOrder, lower(title)
                    """,
                    [stratagem_id],
                )
            ]
            for container in containers:
                container["components"] = self._components_for_rule_container(conn, container["id"])
            faqs = self._faq_rows(conn, stratagem_id=stratagem_id)
        return {"stratagem": stratagem, "containers": containers, "faqs": faqs}

    def sheets_enhancements(
        self,
        faction_id=None,
        publication_id=None,
        detachment_id=None,
        q="",
        limit=None,
        include_combat_patrol=False,
    ):
        if not faction_id and not publication_id and not detachment_id:
            raise ValueError("faction_id, publication_id, or detachment_id is required")
        with self.connect(readonly=True) as conn:
            faction = self._faction_row(conn, faction_id) if faction_id else None
            publication = self._publication_row(conn, publication_id) if publication_id else None
            detachment = self._detachment_row(conn, detachment_id) if detachment_id else None
            rows = self._enhancement_rows(
                conn,
                faction_id=faction_id,
                publication_id=publication_id,
                detachment_id=detachment_id,
                q=q,
                limit=limit,
                include_combat_patrol=include_combat_patrol,
            )
        return {
            "faction": faction,
            "publication": publication,
            "detachment": detachment,
            "enhancements": rows,
            "count": len(rows),
            "limit": self._limit(limit),
        }

    def sheets_enhancement(self, enhancement_id):
        with self.connect(readonly=True) as conn:
            row = conn.execute(
                """
                select e.id, e.name, e.rules, e.lore, e.basePointsCost,
                       e.publicationId, p.name as publicationName,
                       p.factionKeywordId, fk.name as factionName,
                       e.detachmentId, d.name as detachmentName,
                       e.displayOrder, e.cannotBeWarlord,
                       e.isIncludedInEnhancementLimit, e.isEquipableByEpicHero,
                       e.isEquipableByNonCharacterUnit, e.enhancementType,
                       e."limit" as enhancementLimit, e.isCombatPatrolDefault
                from enhancement e
                join publication p on p.id = e.publicationId
                left join faction_keyword fk on fk.id = p.factionKeywordId
                left join detachment d on d.id = e.detachmentId
                where e.id = ?
                """,
                [enhancement_id],
            ).fetchone()
            if not row:
                raise ValueError("Enhancement not found")
            enhancement = dict_row(row)
            keyword_points = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select ekpc.id, ekpc.keywordId, k.name as keywordName,
                           ekpc.pointsCost, ekpc.displayOrder
                    from enhancement_keyword_points_cost ekpc
                    join keyword k on k.id = ekpc.keywordId
                    where ekpc.enhancementId = ?
                    order by ekpc.displayOrder, lower(k.name)
                    """,
                    [enhancement_id],
                )
            ]
            required_keyword_groups = self._enhancement_required_keyword_groups(conn, enhancement_id)
            excluded_keywords = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select k.id, k.name
                    from enhancement_excluded_keyword eek
                    join keyword k on k.id = eek.keywordId
                    where eek.enhancementId = ?
                    order by lower(k.name)
                    """,
                    [enhancement_id],
                )
            ]
            bodyguard_groups = self._enhancement_bodyguard_groups(conn, enhancement_id)
            abilities = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select da.id, da.name, da.abilityType, da.rules, da.lore,
                           da.isPsychic, da.isAura, da.isBondsman,
                           da.subAbilityHeader, da.isPain
                    from enhancement_datasheet_ability eda
                    join datasheet_ability da on da.id = eda.datasheetAbilityId
                    where eda.enhancementId = ?
                    order by lower(da.name)
                    """,
                    [enhancement_id],
                )
            ]
            wargear_profiles = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select wip.id, wip.wargearItemId, wi.name as wargearItemName,
                           wip.name, wip.type, wip.range, wip.attacks,
                           wip.ballisticSkill, wip.weaponSkill, wip.strength,
                           wip.armourPenetration, wip.damage, wip.displayOrder,
                           wip.hunterProfileKeyword
                    from enhancement_wargear_item_profile ewip
                    join wargear_item_profile wip on wip.id = ewip.wargearItemProfileId
                    join wargear_item wi on wi.id = wip.wargearItemId
                    where ewip.enhancementId = ?
                    order by wi.name, wip.displayOrder, lower(wip.name)
                    """,
                    [enhancement_id],
                )
            ]
            faqs = self._faq_rows(conn, enhancement_id=enhancement_id)
        return {
            "enhancement": enhancement,
            "keywordPoints": keyword_points,
            "requiredKeywordGroups": required_keyword_groups,
            "excludedKeywords": excluded_keywords,
            "bodyguardGroups": bodyguard_groups,
            "abilities": abilities,
            "wargearProfiles": wargear_profiles,
            "faqs": faqs,
        }

    def sheets_faqs(self, faction_id=None, publication_id=None, q="", limit=None):
        with self.connect(readonly=True) as conn:
            faction = self._faction_row(conn, faction_id) if faction_id else None
            if publication_id:
                publication = self._publication_row(conn, publication_id)
            elif not faction_id:
                publication = self._core_publication(conn)
                publication_id = publication["id"] if publication else None
            else:
                publication = None
            rows = self._faq_rows(
                conn,
                faction_id=faction_id,
                publication_id=publication_id,
                q=q,
                limit=limit,
            )
        return {
            "faction": faction,
            "publication": publication,
            "faqs": rows,
            "count": len(rows),
            "limit": self._limit(limit),
        }

    def sheets_faq(self, faq_id):
        with self.connect(readonly=True) as conn:
            row = conn.execute(
                """
                select f.id, f.displayOrder, f.publicationId,
                       p.name as publicationName, p.factionKeywordId,
                       fk.name as factionName, f.errataHeader, f.errataText,
                       f.question, f.answer
                from faq f
                join publication p on p.id = f.publicationId
                left join faction_keyword fk on fk.id = p.factionKeywordId
                where f.id = ?
                """,
                [faq_id],
            ).fetchone()
            if not row:
                raise ValueError("FAQ not found")
            faq = dict_row(row)
            configs = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select fc.id, fc.datasheetId, ds.name as datasheetName,
                           fc.armyRuleId, ar.name as armyRuleName,
                           fc.detachmentId, det.name as detachmentName,
                           fc.enhancementId, enh.name as enhancementName,
                           fc.stratagemId, s.name as stratagemName,
                           fc.ruleContainerId, rc.title as ruleContainerTitle
                    from faq_config fc
                    left join datasheet ds on ds.id = fc.datasheetId
                    left join army_rule ar on ar.id = fc.armyRuleId
                    left join detachment det on det.id = fc.detachmentId
                    left join enhancement enh on enh.id = fc.enhancementId
                    left join stratagem s on s.id = fc.stratagemId
                    left join rule_container rc on rc.id = fc.ruleContainerId
                    where fc.faqId = ?
                    order by fc.id
                    """,
                    [faq_id],
                )
            ]
        return {"faq": faq, "configs": configs}

    def _limit(self, value):
        if value is None or value == "":
            return self.SHEETS_DEFAULT_LIMIT
        try:
            limit = int(value)
        except (TypeError, ValueError):
            return self.SHEETS_DEFAULT_LIMIT
        return max(1, min(limit, self.SHEETS_MAX_LIMIT))

    def _like(self, value):
        return f"%{value.strip()}%"

    def _preview(self, value, limit=180):
        text = plain_text(value)
        if len(text) <= limit:
            return text
        return text[:limit].rstrip() + "..."

    def _count(self, conn, sql, params=None):
        row = conn.execute(sql, params or []).fetchone()
        return row[0] if row else 0

    def _core_publication(self, conn):
        row = conn.execute(
            """
            select id, name, factionBackgroundImage, factionKeywordId,
                   combatPatrolName, displayOrder, productId, errataDate,
                   isCombatPatrol
            from publication
            where factionKeywordId is null
              and lower(name) = 'core rules'
            order by displayOrder, lower(name)
            limit 1
            """
        ).fetchone()
        if not row:
            row = conn.execute(
                """
                select id, name, factionBackgroundImage, factionKeywordId,
                       combatPatrolName, displayOrder, productId, errataDate,
                       isCombatPatrol
                from publication
                where factionKeywordId is null
                order by case when lower(name) like '%core%' then 0 else 1 end,
                         displayOrder, lower(name)
                limit 1
                """
            ).fetchone()
        return dict_row(row) if row else None

    def _core_counts(self, conn, publication_id):
        if not publication_id:
            return {"ruleSections": 0, "ruleContainers": 0, "stratagems": 0, "faqs": 0}
        return {
            "ruleSections": self._count(
                conn,
                "select count(*) from rule_section where publicationId = ?",
                [publication_id],
            ),
            "ruleContainers": self._count(
                conn,
                """
                select count(*)
                from rule_container rc
                join rule_section rs on rs.id = rc.ruleSectionId
                where rs.publicationId = ?
                """,
                [publication_id],
            ),
            "stratagems": self._count(
                conn,
                "select count(*) from stratagem where publicationId = ?",
                [publication_id],
            ),
            "faqs": self._count(
                conn,
                "select count(*) from faq where publicationId = ?",
                [publication_id],
            ),
        }

    def _faction_row(self, conn, faction_id):
        row = conn.execute(
            """
            select fk.id, fk.name, fk.commonName, fk.moreInfoImage,
                   fk.armySelectionImage, fk.rosterFactionImage,
                   fk.rosterHeaderImage, fk.lore, fk.parentFactionKeywordId,
                   parent.name as parentFactionName,
                   fk.excludedFromArmyBuilder, fk.mandatoryWarlordId
            from faction_keyword fk
            left join faction_keyword parent on parent.id = fk.parentFactionKeywordId
            where fk.id = ?
            """,
            [faction_id],
        ).fetchone()
        if not row:
            raise ValueError("Faction not found")
        return dict_row(row)

    def _publication_row(self, conn, publication_id):
        row = conn.execute(
            """
            select p.id, p.name, p.factionBackgroundImage, p.factionKeywordId,
                   fk.name as factionName, p.combatPatrolName, p.displayOrder,
                   p.productId, p.errataDate, p.isCombatPatrol
            from publication p
            left join faction_keyword fk on fk.id = p.factionKeywordId
            where p.id = ?
            """,
            [publication_id],
        ).fetchone()
        if not row:
            raise ValueError("Publication not found")
        return dict_row(row)

    def _detachment_row(self, conn, detachment_id):
        row = conn.execute(
            """
            select d.id, d.name, d.publicationId, p.name as publicationName,
                   d.bannerImage, d.rowImage, d.displayOrder,
                   d.isFreeFromEntitlements, d.detachmentPointsCost,
                   d.isCombatPatrol
            from detachment d
            join publication p on p.id = d.publicationId
            where d.id = ?
            """,
            [detachment_id],
        ).fetchone()
        if not row:
            raise ValueError("Detachment not found")
        return dict_row(row)

    def _rule_section_row(self, conn, rule_section_id):
        row = conn.execute(
            """
            select rs.id, rs.name, rs.publicationId, p.name as publicationName,
                   rs.parentId, parent.name as parentName, rs.displayOrder
            from rule_section rs
            left join publication p on p.id = rs.publicationId
            left join rule_section parent on parent.id = rs.parentId
            where rs.id = ?
            """,
            [rule_section_id],
        ).fetchone()
        if not row:
            raise ValueError("Rule section not found")
        return dict_row(row)

    def _faction_counts(self, conn, faction_id):
        return {
            "publications": self._count(
                conn,
                """
                select count(*)
                from publication
                where factionKeywordId = ?
                  and isCombatPatrol = 0
                """,
                [faction_id],
            ),
            "armyRules": self._count(
                conn,
                """
                select count(distinct ar.id)
                from army_rule ar
                join publication p on p.id = ar.publicationId
                left join army_rule_faction_keyword arfk on arfk.armyRuleId = ar.id
                where (p.factionKeywordId = ? or arfk.factionKeywordId = ?)
                  and p.isCombatPatrol = 0
                """,
                [faction_id, faction_id],
            ),
            "datasheets": self._count(
                conn,
                """
                select count(distinct d.id)
                from datasheet d
                join publication p on p.id = d.publicationId
                join datasheet_faction_keyword dfk on dfk.datasheetId = d.id
                where dfk.factionKeywordId = ?
                  and p.isCombatPatrol = 0
                """,
                [faction_id],
            ),
            "detachments": self._count(
                conn,
                """
                select count(distinct d.id)
                from detachment d
                join publication p on p.id = d.publicationId
                join detachment_faction_keyword dfk on dfk.detachmentId = d.id
                where dfk.factionKeywordId = ?
                  and d.isCombatPatrol = 0
                  and p.isCombatPatrol = 0
                """,
                [faction_id],
            ),
            "stratagems": self._count(
                conn,
                """
                select count(distinct s.id)
                from stratagem s
                join publication p on p.id = s.publicationId
                left join detachment d on d.id = s.detachmentId
                where (
                    p.factionKeywordId = ?
                    or exists (
                      select 1
                      from detachment_faction_keyword dfk
                      where dfk.detachmentId = d.id
                        and dfk.factionKeywordId = ?
                    )
                  )
                  and p.isCombatPatrol = 0
                """,
                [faction_id, faction_id],
            ),
            "enhancements": self._count(
                conn,
                """
                select count(distinct e.id)
                from enhancement e
                join publication p on p.id = e.publicationId
                left join detachment d on d.id = e.detachmentId
                where (
                    p.factionKeywordId = ?
                    or exists (
                      select 1
                      from detachment_faction_keyword dfk
                      where dfk.detachmentId = d.id
                        and dfk.factionKeywordId = ?
                    )
                  )
                  and p.isCombatPatrol = 0
                """,
                [faction_id, faction_id],
            ),
            "faqs": self._count(
                conn,
                """
                select count(distinct f.id)
                from faq f
                join publication p on p.id = f.publicationId
                where p.factionKeywordId = ?
                  and p.isCombatPatrol = 0
                """,
                [faction_id],
            ),
        }

    def _publication_rows(self, conn, faction_id, include_combat_patrol=False):
        rows = conn.execute(
            """
            select p.id, p.name, p.factionBackgroundImage, p.factionKeywordId,
                   p.combatPatrolName, p.displayOrder, p.productId,
                   p.errataDate, p.isCombatPatrol,
                   (
                     select count(*)
                     from army_rule ar
                     where ar.publicationId = p.id
                   ) as armyRuleCount,
                   (
                     select count(*)
                     from datasheet d
                     where d.publicationId = p.id
                   ) as datasheetCount,
                   (
                     select count(*)
                     from detachment d
                     where d.publicationId = p.id
                   ) as detachmentCount,
                   (
                     select count(*)
                     from stratagem s
                     where s.publicationId = p.id
                   ) as stratagemCount,
                   (
                     select count(*)
                     from enhancement e
                     where e.publicationId = p.id
                   ) as enhancementCount,
                   (
                     select count(*)
                     from faq f
                     where f.publicationId = p.id
                   ) as faqCount
            from publication p
            where p.factionKeywordId = ?
              and (? = 1 or p.isCombatPatrol = 0)
            order by p.isCombatPatrol, p.displayOrder, lower(p.name)
            """,
            [faction_id, 1 if include_combat_patrol else 0],
        ).fetchall()
        return [dict_row(row) for row in rows]

    def _publication_counts(self, conn, publication_id):
        return {
            "ruleSections": self._count(
                conn,
                "select count(*) from rule_section where publicationId = ?",
                [publication_id],
            ),
            "armyRules": self._count(
                conn,
                "select count(*) from army_rule where publicationId = ?",
                [publication_id],
            ),
            "datasheets": self._count(
                conn,
                "select count(*) from datasheet where publicationId = ?",
                [publication_id],
            ),
            "detachments": self._count(
                conn,
                "select count(*) from detachment where publicationId = ?",
                [publication_id],
            ),
            "stratagems": self._count(
                conn,
                "select count(*) from stratagem where publicationId = ?",
                [publication_id],
            ),
            "enhancements": self._count(
                conn,
                "select count(*) from enhancement where publicationId = ?",
                [publication_id],
            ),
            "faqs": self._count(
                conn,
                "select count(*) from faq where publicationId = ?",
                [publication_id],
            ),
        }

    def _rule_sections(self, conn, publication_id, parent_id):
        where = []
        params = []
        if publication_id:
            where.append("rs.publicationId = ?")
            params.append(publication_id)
        if parent_id:
            where.append("rs.parentId = ?")
            params.append(parent_id)
        else:
            where.append("rs.parentId is null")
        if not where:
            where.append("1 = 1")
        rows = conn.execute(
            f"""
            select rs.id, rs.name, rs.publicationId, p.name as publicationName,
                   rs.parentId, parent.name as parentName, rs.displayOrder,
                   (
                     select count(*)
                     from rule_section child
                     where child.parentId = rs.id
                   ) as childSectionCount,
                   (
                     select count(*)
                     from rule_container rc
                     where rc.ruleSectionId = rs.id
                   ) as containerCount
            from rule_section rs
            left join publication p on p.id = rs.publicationId
            left join rule_section parent on parent.id = rs.parentId
            where {" and ".join(where)}
            order by rs.displayOrder, lower(rs.name)
            """,
            params,
        ).fetchall()
        return [dict_row(row) for row in rows]

    def _stratagem_rows(
        self,
        conn,
        faction_id=None,
        publication_id=None,
        detachment_id=None,
        q="",
        limit=None,
        include_combat_patrol=False,
    ):
        where = []
        params = []
        if faction_id:
            where.append(
                """
                (
                  p.factionKeywordId = ?
                  or exists (
                    select 1
                    from detachment_faction_keyword dfk
                    where dfk.detachmentId = s.detachmentId
                      and dfk.factionKeywordId = ?
                  )
                )
                """
            )
            params.extend([faction_id, faction_id])
        if publication_id:
            where.append("s.publicationId = ?")
            params.append(publication_id)
        if detachment_id:
            where.append("s.detachmentId = ?")
            params.append(detachment_id)
        if not include_combat_patrol:
            where.append("p.isCombatPatrol = 0")
        if q:
            where.append(
                """
                (
                  s.name like ? or s.category like ? or s.whenRules like ?
                  or s.targetRules like ? or s.effectRules like ?
                )
                """
            )
            like = self._like(q)
            params.extend([like, like, like, like, like])
        if not where:
            where.append("1 = 1")
        params.append(self._limit(limit))
        rows = conn.execute(
            f"""
            select distinct s.id, s.name, s.cpCost, s.category, s.key,
                   s.detachmentId, d.name as detachmentName,
                   s.publicationId, p.name as publicationName,
                   p.factionKeywordId, fk.name as factionName,
                   s.displayOrder,
                   s.whenRules, s.targetRules, s.effectRules, s.restrictionRules,
                   s.secondaryEffectAdditionalCPCost,
                   s.secondaryEffectIsMutuallyExclusive,
                   s.secondaryEffect,
                   s.lore
            from stratagem s
            join publication p on p.id = s.publicationId
            left join faction_keyword fk on fk.id = p.factionKeywordId
            left join detachment d on d.id = s.detachmentId
            where {" and ".join(where)}
            order by p.displayOrder,
                     case when d.id is null then 0 else 1 end,
                     d.displayOrder,
                     s.displayOrder,
                     lower(s.name)
            limit ?
            """,
            params,
        ).fetchall()
        data = []
        for row in rows:
            item = dict_row(row)
            item["whenRules"] = self._preview(item["whenRules"], 160)
            item["targetRules"] = self._preview(item["targetRules"], 160)
            item["effectRules"] = self._preview(item["effectRules"], 220)
            item["restrictionRules"] = self._preview(item["restrictionRules"], 160)
            item["lore"] = self._preview(item["lore"], 160)
            data.append(item)
        return data

    def _enhancement_rows(
        self,
        conn,
        faction_id=None,
        publication_id=None,
        detachment_id=None,
        q="",
        limit=None,
        include_combat_patrol=False,
    ):
        where = []
        params = []
        if faction_id:
            where.append(
                """
                (
                  p.factionKeywordId = ?
                  or exists (
                    select 1
                    from detachment_faction_keyword dfk
                    where dfk.detachmentId = e.detachmentId
                      and dfk.factionKeywordId = ?
                  )
                )
                """
            )
            params.extend([faction_id, faction_id])
        if publication_id:
            where.append("e.publicationId = ?")
            params.append(publication_id)
        if detachment_id:
            where.append("e.detachmentId = ?")
            params.append(detachment_id)
        if not include_combat_patrol:
            where.append("p.isCombatPatrol = 0")
        if q:
            where.append("(e.name like ? or e.rules like ?)")
            params.extend([self._like(q), self._like(q)])
        if not where:
            where.append("1 = 1")
        params.append(self._limit(limit))
        rows = conn.execute(
            f"""
            select distinct e.id, e.name, e.basePointsCost,
                   e.publicationId, p.name as publicationName,
                   p.factionKeywordId, fk.name as factionName,
                   e.detachmentId, d.name as detachmentName,
                   e.displayOrder, e.enhancementType,
                   e.cannotBeWarlord, e.isIncludedInEnhancementLimit,
                   e.isEquipableByEpicHero, e.isEquipableByNonCharacterUnit,
                   e."limit" as enhancementLimit, e.isCombatPatrolDefault, e.rules, e.lore,
                   (
                     select count(*)
                     from enhancement_required_keyword_group erkg
                     where erkg.enhancementId = e.id
                   ) as requiredKeywordGroupCount,
                   (
                     select count(*)
                     from enhancement_excluded_keyword eek
                     where eek.enhancementId = e.id
                   ) as excludedKeywordCount,
                   (
                     select count(*)
                     from faq_config fc
                     where fc.enhancementId = e.id
                   ) as faqCount
            from enhancement e
            join publication p on p.id = e.publicationId
            left join faction_keyword fk on fk.id = p.factionKeywordId
            left join detachment d on d.id = e.detachmentId
            where {" and ".join(where)}
            order by p.displayOrder, d.displayOrder, e.displayOrder, lower(e.name)
            limit ?
            """,
            params,
        ).fetchall()
        data = []
        for row in rows:
            item = dict_row(row)
            item["rules"] = self._preview(item["rules"], 240)
            item["lore"] = self._preview(item["lore"], 160)
            data.append(item)
        return data

    def _faq_rows(
        self,
        conn,
        faction_id=None,
        publication_id=None,
        q="",
        limit=None,
        datasheet_id=None,
        army_rule_id=None,
        detachment_id=None,
        enhancement_id=None,
        stratagem_id=None,
        rule_container_id=None,
    ):
        where = []
        params = []
        entity_filters = [
            ("datasheetId", datasheet_id),
            ("armyRuleId", army_rule_id),
            ("detachmentId", detachment_id),
            ("enhancementId", enhancement_id),
            ("stratagemId", stratagem_id),
            ("ruleContainerId", rule_container_id),
        ]
        for column, value in entity_filters:
            if value:
                where.append(
                    f"""
                    exists (
                      select 1
                      from faq_config fc
                      where fc.faqId = f.id
                        and fc.{column} = ?
                    )
                    """
                )
                params.append(value)
        if faction_id:
            where.append("p.factionKeywordId = ?")
            params.append(faction_id)
        if publication_id:
            where.append("f.publicationId = ?")
            params.append(publication_id)
        if q:
            where.append(
                """
                (
                  f.question like ? or f.answer like ?
                  or f.errataHeader like ? or f.errataText like ?
                )
                """
            )
            like = self._like(q)
            params.extend([like, like, like, like])
        if not where:
            where.append("1 = 1")
        params.append(self._limit(limit))
        rows = conn.execute(
            f"""
            select f.id, f.displayOrder, f.publicationId,
                   p.name as publicationName, p.factionKeywordId,
                   fk.name as factionName, f.errataHeader, f.errataText,
                   f.question, f.answer,
                   (
                     select count(*)
                     from faq_config fc
                     where fc.faqId = f.id
                   ) as configCount
            from faq f
            join publication p on p.id = f.publicationId
            left join faction_keyword fk on fk.id = p.factionKeywordId
            where {" and ".join(where)}
            order by p.displayOrder, f.displayOrder, f.id
            limit ?
            """,
            params,
        ).fetchall()
        data = []
        for row in rows:
            item = dict_row(row)
            item["errataText"] = self._preview(item["errataText"], 220)
            item["question"] = self._preview(item["question"], 220)
            item["answer"] = self._preview(item["answer"], 260)
            data.append(item)
        return data

    def _components_for_rule_container(self, conn, container_id):
        return self._components(conn, "ruleContainerId", container_id)

    def _components_for_army_rule(self, conn, army_rule_id):
        return self._components(conn, "armyRuleId", army_rule_id)

    def _components_for_detachment_rule(self, conn, detachment_rule_id):
        return self._components(conn, "detachmentRuleId", detachment_rule_id)

    def _components(self, conn, owner_column, owner_id):
        rows = conn.execute(
            f"""
            select id, type, imageUrl, title, subtitle, backgroundColor,
                   ruleContainerId, armyRuleId, detachmentRuleId,
                   displayOrder, altText, textContent, trigger, effect,
                   secondaryObjectiveId, objectiveId, missionTwistId
            from rule_container_component
            where {owner_column} = ?
            order by displayOrder, id
            """,
            [owner_id],
        ).fetchall()
        components = [dict_row(row) for row in rows]
        for component in components:
            component["bulletPoints"] = [
                dict_row(item)
                for item in conn.execute(
                    """
                    select id, text, indent, displayOrder
                    from bullet_point
                    where ruleContainerComponentId = ?
                    order by displayOrder, indent, id
                    """,
                    [component["id"]],
                )
            ]
        return components

    def _datasheet_miniatures(self, conn, datasheet_id):
        return [
            dict_row(item)
            for item in conn.execute(
                """
                select id, name, movement, toughness, save, wounds, leadership,
                       objectiveControl, statlineHidden, isSupremeCommander,
                       cannotBeWarlord, excludedFromEnhancements, datasheetId,
                       displayOrder, isIndividualModels, canBeNonCharacterWarlord,
                       miniatureSlots
                from miniature
                where datasheetId = ?
                order by displayOrder, lower(name)
                """,
                [datasheet_id],
            )
        ]

    def _unit_compositions(self, conn, datasheet_id):
        rows = conn.execute(
            """
            select id, datasheetId, points, isDefault, displayOrder,
                   referenceGroupingKeywordId
            from unit_composition
            where datasheetId = ?
            order by isDefault desc, displayOrder, points
            """,
            [datasheet_id],
        ).fetchall()
        compositions = []
        for row in rows:
            item = dict_row(row)
            item["models"] = [
                dict_row(model)
                for model in conn.execute(
                    """
                    select ucm.miniatureId, m.name, ucm.min, ucm.max,
                           m.displayOrder
                    from unit_composition_miniature ucm
                    join miniature m on m.id = ucm.miniatureId
                    where ucm.unitCompositionId = ?
                    order by m.displayOrder, lower(m.name)
                    """,
                    [item["id"]],
                )
            ]
            compositions.append(item)
        return compositions

    def _datasheet_abilities(self, conn, datasheet_id):
        rows = conn.execute(
            """
            select da.id, da.name, da.abilityType, da.rules, da.lore,
                   da.isPsychic, da.isAura, da.isBondsman,
                   da.armyRuleId, ar.name as armyRuleName,
                   da.detachmentRuleId, dr.name as detachmentRuleName,
                   da.subAbilityHeader, da.isPain,
                   dda.restriction, dda.displayOrder
            from datasheet_datasheet_ability dda
            join datasheet_ability da on da.id = dda.datasheetAbilityId
            left join army_rule ar on ar.id = da.armyRuleId
            left join detachment_rule dr on dr.id = da.detachmentRuleId
            where dda.datasheetId = ?
            order by dda.displayOrder, lower(da.name)
            """,
            [datasheet_id],
        ).fetchall()
        abilities = []
        for row in rows:
            item = dict_row(row)
            item["subAbilities"] = [
                dict_row(sub)
                for sub in conn.execute(
                    """
                    select id, name, rules, displayOrder
                    from datasheet_sub_ability
                    where datasheetAbilityId = ?
                    order by displayOrder, lower(name)
                    """,
                    [item["id"]],
                )
            ]
            abilities.append(item)
        return abilities

    def _datasheet_wargear_options(self, conn, datasheet_id):
        return [
            dict_row(item)
            for item in conn.execute(
                """
                select wog.id as groupId, wog.instructionText, wog.miniatureId,
                       m.name as miniatureName, wog.displayOrder as groupDisplayOrder,
                       wog.isStaticWargear, wo.id as optionId, wo.inputType,
                       wo.defaultValue, wo.displayOrder as optionDisplayOrder,
                       wo.points, wi.id as wargearItemId, wi.name as wargearItemName,
                       wi.wargearType, wi.ruleText
                from wargear_option_group wog
                left join miniature m on m.id = wog.miniatureId
                join wargear_option wo on wo.wargearOptionGroupId = wog.id
                join wargear_item wi on wi.id = wo.wargearItemId
                where wog.datasheetId = ?
                order by wog.displayOrder, wo.displayOrder, lower(wi.name)
                """,
                [datasheet_id],
            )
        ]

    def _datasheet_wargear_profiles(self, conn, datasheet_id):
        return [
            dict_row(item)
            for item in conn.execute(
                """
                select distinct wip.id, wip.wargearItemId,
                       wi.name as wargearItemName, wip.name, wip.type,
                       wip.range, wip.attacks, wip.ballisticSkill,
                       wip.weaponSkill, wip.strength, wip.armourPenetration,
                       wip.damage, wip.displayOrder, wip.hunterProfileKeyword
                from wargear_option_group wog
                join wargear_option wo on wo.wargearOptionGroupId = wog.id
                join wargear_item wi on wi.id = wo.wargearItemId
                join wargear_item_profile wip on wip.wargearItemId = wi.id
                where wog.datasheetId = ?
                order by wi.name, wip.displayOrder, lower(wip.name)
                """,
                [datasheet_id],
            )
        ]

    def _datasheet_keywords(self, conn, datasheet_id):
        return [
            dict_row(item)
            for item in conn.execute(
                """
                select m.id as miniatureId, m.name as miniatureName,
                       k.id as keywordId, k.name as keywordName,
                       mk.displayOrder
                from miniature m
                join miniature_keyword mk on mk.miniatureId = m.id
                join keyword k on k.id = mk.keywordId
                where m.datasheetId = ?
                order by m.displayOrder, mk.displayOrder, lower(k.name)
                """,
                [datasheet_id],
            )
        ]

    def _detachment_details(self, conn, detachment_id):
        rows = conn.execute(
            """
            select id, title, detachmentId, displayOrder
            from detachment_detail
            where detachmentId = ?
            order by displayOrder, lower(title)
            """,
            [detachment_id],
        ).fetchall()
        details = []
        for row in rows:
            item = dict_row(row)
            item["bulletPoints"] = [
                dict_row(bp)
                for bp in conn.execute(
                    """
                    select id, text, displayOrder
                    from detachment_detail_bullet_point
                    where detachmentDetailId = ?
                    order by displayOrder, id
                    """,
                    [item["id"]],
                )
            ]
            details.append(item)
        return details

    def _detachment_rules(self, conn, detachment_id):
        rows = conn.execute(
            """
            select id, name, detachmentId, displayOrder, hiddenFromCommandBunker
            from detachment_rule
            where detachmentId = ?
            order by displayOrder, lower(name)
            """,
            [detachment_id],
        ).fetchall()
        rules = []
        for row in rows:
            item = dict_row(row)
            item["components"] = self._components_for_detachment_rule(conn, item["id"])
            item["abilities"] = [
                dict_row(ability)
                for ability in conn.execute(
                    """
                    select id, name, abilityType, rules, lore, isPsychic,
                           isAura, isBondsman, subAbilityHeader, isPain
                    from datasheet_ability
                    where detachmentRuleId = ?
                    order by lower(name)
                    """,
                    [item["id"]],
                )
            ]
            rules.append(item)
        return rules

    def _detachment_datasheet_links(self, conn, table_name, detachment_id):
        rows = conn.execute(
            f"""
            select ds.id, ds.name, ds.publicationId, p.name as publicationName,
                   ds.baseSize, ds.displayOrder
            from {table_name} link
            join datasheet ds on ds.id = link.datasheetId
            join publication p on p.id = ds.publicationId
            where link.detachmentId = ?
            order by ds.displayOrder, lower(ds.name)
            """,
            [detachment_id],
        ).fetchall()
        return [dict_row(row) for row in rows]

    def _detachment_linked_datasheets(self, conn, detachment_id):
        rows = conn.execute(
            """
            select ds.id, ds.name, ds.publicationId, p.name as publicationName,
                   ds.baseSize, ds.displayOrder, dld.count
            from detachment_linked_datasheet dld
            join datasheet ds on ds.id = dld.datasheetId
            join publication p on p.id = ds.publicationId
            where dld.detachmentId = ?
            order by ds.displayOrder, lower(ds.name)
            """,
            [detachment_id],
        ).fetchall()
        return [dict_row(row) for row in rows]

    def _detachment_miniature_links(self, conn, table_name, detachment_id):
        rows = conn.execute(
            f"""
            select m.id, m.name, m.datasheetId, ds.name as datasheetName,
                   m.displayOrder
            from {table_name} link
            join miniature m on m.id = link.miniatureId
            join datasheet ds on ds.id = m.datasheetId
            where link.detachmentId = ?
            order by ds.displayOrder, m.displayOrder, lower(m.name)
            """,
            [detachment_id],
        ).fetchall()
        return [dict_row(row) for row in rows]

    def _enhancement_required_keyword_groups(self, conn, enhancement_id):
        rows = conn.execute(
            """
            select erkg.id, erkg.enhancementId, erkg.datasheetId,
                   ds.name as datasheetName
            from enhancement_required_keyword_group erkg
            left join datasheet ds on ds.id = erkg.datasheetId
            where erkg.enhancementId = ?
            order by erkg.id
            """,
            [enhancement_id],
        ).fetchall()
        groups = []
        for row in rows:
            item = dict_row(row)
            item["keywords"] = [
                dict_row(keyword)
                for keyword in conn.execute(
                    """
                    select k.id, k.name
                    from enhancement_required_keyword_group_keyword erkgk
                    join keyword k on k.id = erkgk.keywordId
                    where erkgk.enhancementRequiredKeywordGroupId = ?
                    order by lower(k.name)
                    """,
                    [item["id"]],
                )
            ]
            item["factionKeywords"] = [
                dict_row(faction)
                for faction in conn.execute(
                    """
                    select fk.id, fk.name, fk.commonName
                    from enhancement_required_keyword_group_faction_keyword erkgfk
                    join faction_keyword fk on fk.id = erkgfk.factionKeywordId
                    where erkgfk.enhancementRequiredKeywordGroupId = ?
                    order by lower(fk.name)
                    """,
                    [item["id"]],
                )
            ]
            groups.append(item)
        return groups

    def _enhancement_bodyguard_groups(self, conn, enhancement_id):
        rows = conn.execute(
            """
            select ebg.id, ebg.bodyguardType, ebg.factionKeywordId,
                   fk.name as factionKeywordName, ebg.enhancementId
            from enhancement_bodyguard_group ebg
            left join faction_keyword fk on fk.id = ebg.factionKeywordId
            where ebg.enhancementId = ?
            order by ebg.bodyguardType, ebg.id
            """,
            [enhancement_id],
        ).fetchall()
        groups = []
        for row in rows:
            item = dict_row(row)
            item["keywords"] = [
                dict_row(keyword)
                for keyword in conn.execute(
                    """
                    select k.id, k.name
                    from enhancement_bodyguard_group_keyword ebgk
                    join keyword k on k.id = ebgk.keywordId
                    where ebgk.enhancementBodyguardGroupId = ?
                    order by lower(k.name)
                    """,
                    [item["id"]],
                )
            ]
            item["datasheets"] = [
                dict_row(datasheet)
                for datasheet in conn.execute(
                    """
                    select ds.id, ds.name, ds.publicationId
                    from enhancement_bodyguard_group_datasheet ebgd
                    join datasheet ds on ds.id = ebgd.datasheetId
                    where ebgd.enhancementBodyguardGroupId = ?
                    order by lower(ds.name)
                    """,
                    [item["id"]],
                )
            ]
            groups.append(item)
        return groups
