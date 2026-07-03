from roster_builder_codex_rich_text import core_rule_href
from roster_builder_search_core import (
    CORE_RULES_PUBLICATION_ID,
    codex_route_maps,
    compact_text,
    faction_href,
    normalize_rule_section_code,
)

def search_static_items(builder, conn):
    core_faq = conn.execute(
        """
        select group_concat(
          coalesce(errataHeader, '') || ' ' ||
          coalesce(errataText, '') || ' ' ||
          coalesce(question, '') || ' ' ||
          coalesce(answer, ''),
          ' '
        ) as faqText
        from faq
        where publicationId = ?
        """,
        [CORE_RULES_PUBLICATION_ID],
    ).fetchone()
    return [
        {
            "type": "App",
            "title": "Codex",
            "meta": "Reference",
            "text": "Core Rules Imperium Chaos Xenos factions datasheets detachments stratagems FAQ",
            "href": "/codex",
        },
        {
            "type": "Section",
            "title": "Core Rules",
            "meta": "Codex",
            "text": "Rules Stratagems FAQ Warhammer 40,000 reference",
            "href": "/codex/core-rules",
        },
        {
            "type": "Section",
            "title": "Core Rules FAQ",
            "meta": "Codex / Core Rules",
            "text": core_faq["faqText"] if core_faq else "",
            "href": "/codex/core-rules/faq",
        },
        {
            "type": "Section",
            "title": "Imperium",
            "meta": "Codex",
            "text": "Imperial factions Adeptus Astartes Space Marines",
            "href": "/codex/imperium",
        },
        {
            "type": "Section",
            "title": "Adeptus Astartes",
            "meta": "Codex / Imperium",
            "text": "Space Marines chapters",
            "href": "/codex/imperium/adeptus-astartes",
        },
        {
            "type": "Section",
            "title": "Chaos",
            "meta": "Codex",
            "text": "Chaos factions Heretic Astartes Daemons",
            "href": "/codex/chaos",
        },
        {
            "type": "Section",
            "title": "Xenos",
            "meta": "Codex",
            "text": "Xenos factions",
            "href": "/codex/xenos",
        },
    ]

def search_faction_items(builder, conn):
    rows = conn.execute(
        """
        select id, name, commonName, lore
        from faction_keyword
        where excludedFromArmyBuilder = 0
        order by lower(name)
        """
    ).fetchall()
    return [
        {
            "type": "Faction",
            "title": row["name"],
            "meta": "Codex",
            "text": compact_text(row["commonName"], row["lore"]),
            "href": faction_href(row["name"]),
        }
        for row in rows
    ]

def search_core_rule_items(builder, conn):
    sections = [
        {
            "type": "Section",
            "title": row["name"],
            "meta": "Core Rules",
            "text": "Rules section",
            "href": f"/codex/core-rules/section/{normalize_rule_section_code(row['name'])}",
        }
        for row in conn.execute(
            """
            select id, name
            from rule_section
            where publicationId = ?
            order by displayOrder, name
            """,
            [CORE_RULES_PUBLICATION_ID],
        )
    ]
    rules = [
        {
            "type": "Stratagem" if row["containerType"] == "stratagem" else "Core Rule",
            "title": row["title"],
            "meta": compact_text("Core Rules", row["sectionName"], row["subtitle"]),
            "text": compact_text(
                row["containerType"],
                row["stratagemName"],
                row["lore"],
                row["whenRules"],
                row["targetRules"],
                row["effectRules"],
                row["restrictionRules"],
                row["secondaryEffect"],
                row["componentText"],
                row["faqText"],
            ),
            "href": core_rule_href(row["subtitle"]),
        }
        for row in conn.execute(
            """
            select rc.id, rc.title, rc.subtitle, rc.containerType,
                   rs.name as sectionName,
                   s.name as stratagemName, s.lore, s.whenRules, s.targetRules,
                   s.effectRules, s.restrictionRules, s.secondaryEffect,
                   (
                     select group_concat(
                       coalesce(rcc.title, '') || ' ' ||
                       coalesce(rcc.subtitle, '') || ' ' ||
                       coalesce(rcc.textContent, '') || ' ' ||
                       coalesce(rcc.trigger, '') || ' ' ||
                       coalesce(rcc.effect, '') || ' ' ||
                       coalesce(rcc.altText, ''),
                       ' '
                     )
                     from rule_container_component rcc
                     where rcc.ruleContainerId = rc.id
                   ) as componentText,
                   (
                     select group_concat(
                       coalesce(f.errataHeader, '') || ' ' ||
                       coalesce(f.errataText, '') || ' ' ||
                       coalesce(f.question, '') || ' ' ||
                       coalesce(f.answer, ''),
                       ' '
                     )
                     from faq_config fc
                     join faq f on f.id = fc.faqId
                     where fc.ruleContainerId = rc.id
                   ) as faqText
            from rule_container rc
            join rule_section rs on rs.id = rc.ruleSectionId
            left join stratagem s on s.id = rc.stratagemId
            where rs.publicationId = ?
            order by rs.displayOrder, rc.displayOrder, rc.title
            """,
            [CORE_RULES_PUBLICATION_ID],
        )
    ]
    return sections + rules

def search_army_rule_items(builder, conn):
    rows = conn.execute(
        """
        select ar.id, ar.name, fk.id as factionId, fk.name as factionName,
               (
                 select group_concat(
                   coalesce(rcc.title, '') || ' ' ||
                   coalesce(rcc.subtitle, '') || ' ' ||
                   coalesce(rcc.textContent, '') || ' ' ||
                   coalesce(rcc.trigger, '') || ' ' ||
                   coalesce(rcc.effect, '') || ' ' ||
                   coalesce(rcc.altText, ''),
                   ' '
                 )
                 from rule_container_component rcc
                 where rcc.armyRuleId = ar.id
               ) as componentText,
               (
                 select group_concat(
                   coalesce(f.errataHeader, '') || ' ' ||
                   coalesce(f.errataText, '') || ' ' ||
                   coalesce(f.question, '') || ' ' ||
                   coalesce(f.answer, ''),
                   ' '
                 )
                 from faq_config fc
                 join faq f on f.id = fc.faqId
                 where fc.armyRuleId = ar.id
               ) as faqText
        from army_rule ar
        join army_rule_faction_keyword arfk on arfk.armyRuleId = ar.id
        join faction_keyword fk on fk.id = arfk.factionKeywordId
        where ar.hiddenFromCommandBunker = 0
          and fk.excludedFromArmyBuilder = 0
        order by lower(fk.name), ar.displayOrder, lower(ar.name)
        """
    ).fetchall()
    return [
        {
            "type": "Army Rule",
            "title": row["name"],
            "meta": compact_text(row["factionName"]),
            "text": compact_text(row["componentText"], row["faqText"]),
            "href": f"{faction_href(row['factionName'])}/army-rule",
        }
        for row in rows
    ]

def search_datasheet_items(builder, conn):
    rows = conn.execute(
        """
        select d.id, d.name, d.unitComposition, d.lore, d.baseSize,
               fk.id as factionId, fk.name as factionName,
               (
                 select group_concat(
                   coalesce(m.name, '') || ' ' ||
                   coalesce(m.movement, '') || ' ' ||
                   coalesce(m.toughness, '') || ' ' ||
                   coalesce(m.save, '') || ' ' ||
                   coalesce(m.wounds, '') || ' ' ||
                   coalesce(m.leadership, '') || ' ' ||
                   coalesce(m.objectiveControl, ''),
                   ' '
                 )
                 from miniature m
                 where m.datasheetId = d.id
               ) as miniatureText,
               (
                 select group_concat(dr.name || ' ' || dr.rules, ' ')
                 from datasheet_rule dr
                 where dr.datasheetId = d.id
               ) as ruleText,
               (
                 select group_concat(
                   da.name || ' ' ||
                   da.abilityType || ' ' ||
                   da.rules || ' ' ||
                   coalesce(da.lore, '') || ' ' ||
                   coalesce(da.subAbilityHeader, '') || ' ' ||
                   coalesce(dsa.name, '') || ' ' ||
                   coalesce(dsa.rules, ''),
                   ' '
                 )
                 from datasheet_datasheet_ability dda
                 join datasheet_ability da on da.id = dda.datasheetAbilityId
                 left join datasheet_sub_ability dsa on dsa.datasheetAbilityId = da.id
                 where dda.datasheetId = d.id
               ) as abilityText,
               (
                 select group_concat(
                   coalesce(inv.rules, '') || ' ' ||
                   coalesce(inv.save, '') || ' ' ||
                   coalesce(inv.meleeSave, '') || ' ' ||
                   coalesce(inv.rangedSave, ''),
                   ' '
                 )
                 from invulnerable_save inv
                 where inv.datasheetId = d.id
               ) as invulnerableText,
               (
                 select group_concat(name || ' ' || rules, ' ')
                 from datasheet_damage dd
                 where dd.datasheetId = d.id
               ) as damageText,
               (
                 select group_concat(rulesText, ' ')
                 from wargear_rule wr
                 where wr.datasheetId = d.id
               ) as wargearRuleText,
               (
                 select group_concat(
                   coalesce(wog.instructionText, '') || ' ' ||
                   coalesce(m.name, '') || ' ' ||
                   coalesce(wi.name, '') || ' ' ||
                   coalesce(wi.wargearType, '') || ' ' ||
                   coalesce(wi.ruleText, '') || ' ' ||
                   coalesce(wip.name, '') || ' ' ||
                   coalesce(wip.type, '') || ' ' ||
                   coalesce(wip.range, '') || ' ' ||
                   coalesce(wip.attacks, '') || ' ' ||
                   coalesce(wip.ballisticSkill, '') || ' ' ||
                   coalesce(wip.weaponSkill, '') || ' ' ||
                   coalesce(wip.strength, '') || ' ' ||
                   coalesce(wip.armourPenetration, '') || ' ' ||
                   coalesce(wip.damage, '') || ' ' ||
                   coalesce(wa.name, ''),
                   ' '
                 )
                 from wargear_option_group wog
                 left join miniature m on m.id = wog.miniatureId
                 left join wargear_option wo on wo.wargearOptionGroupId = wog.id
                 left join wargear_item wi on wi.id = wo.wargearItemId
                 left join wargear_item_profile wip on wip.wargearItemId = wi.id
                 left join wargear_item_profile_wargear_ability wipwa on wipwa.wargearItemProfileId = wip.id
                 left join wargear_ability wa on wa.id = wipwa.wargearAbilityId
                 where wog.datasheetId = d.id
               ) as wargearText,
               (
                 select group_concat(
                   coalesce(f.errataHeader, '') || ' ' ||
                   coalesce(f.errataText, '') || ' ' ||
                   coalesce(f.question, '') || ' ' ||
                   coalesce(f.answer, ''),
                   ' '
                 )
                 from faq_config fc
                 join faq f on f.id = fc.faqId
                 where fc.datasheetId = d.id
               ) as faqText
        from datasheet d
        join datasheet_faction_keyword dfk on dfk.datasheetId = d.id
        join faction_keyword fk on fk.id = dfk.factionKeywordId
        where fk.excludedFromArmyBuilder = 0
        order by lower(fk.name), lower(d.name)
        """
    ).fetchall()
    href_by_key = codex_route_maps(builder)["datasheets"]
    return [
        {
            "type": "Datasheet",
            "title": row["name"],
            "meta": row["factionName"],
            "text": compact_text(
                row["unitComposition"],
                row["lore"],
                row["baseSize"],
                row["miniatureText"],
                row["ruleText"],
                row["abilityText"],
                row["invulnerableText"],
                row["damageText"],
                row["wargearRuleText"],
                row["wargearText"],
                row["faqText"],
            ),
            "href": href_by_key[(row["factionId"], row["id"])],
        }
        for row in rows
        if (row["factionId"], row["id"]) in href_by_key
    ]

def search_detachment_items(builder, conn):
    rows = conn.execute(
        """
        select d.id, d.name, fk.id as factionId, fk.name as factionName,
               (
                 select group_concat(
                   dd.title || ' ' || coalesce(ddbp.text, ''),
                   ' '
                 )
                 from detachment_detail dd
                 left join detachment_detail_bullet_point ddbp on ddbp.detachmentDetailId = dd.id
                 where dd.detachmentId = d.id
               ) as detailText,
               (
                 select group_concat(
                   coalesce(f.errataHeader, '') || ' ' ||
                   coalesce(f.errataText, '') || ' ' ||
                   coalesce(f.question, '') || ' ' ||
                   coalesce(f.answer, ''),
                   ' '
                 )
                 from faq_config fc
                 join faq f on f.id = fc.faqId
                 where fc.detachmentId = d.id
               ) as faqText
        from detachment d
        join detachment_faction_keyword dfk on dfk.detachmentId = d.id
        join faction_keyword fk on fk.id = dfk.factionKeywordId
        where fk.excludedFromArmyBuilder = 0
        order by lower(fk.name), lower(d.name)
        """
    ).fetchall()
    href_by_key = codex_route_maps(builder)["detachments"]
    return [
        {
            "type": "Detachment",
            "title": row["name"],
            "meta": row["factionName"],
            "text": compact_text(row["detailText"], row["faqText"]),
            "href": href_by_key[(row["factionId"], row["id"])],
        }
        for row in rows
        if (row["factionId"], row["id"]) in href_by_key
    ]

def search_detachment_rule_items(builder, conn):
    rows = conn.execute(
        """
        select dr.id, dr.name, d.id as detachmentId, d.name as detachmentName,
               fk.id as factionId, fk.name as factionName,
               (
                 select group_concat(
                   coalesce(rcc.title, '') || ' ' ||
                   coalesce(rcc.subtitle, '') || ' ' ||
                   coalesce(rcc.textContent, '') || ' ' ||
                   coalesce(rcc.trigger, '') || ' ' ||
                   coalesce(rcc.effect, '') || ' ' ||
                   coalesce(rcc.altText, ''),
                   ' '
                 )
                 from rule_container_component rcc
                 where rcc.detachmentRuleId = dr.id
               ) as componentText
        from detachment_rule dr
        join detachment d on d.id = dr.detachmentId
        join detachment_faction_keyword dfk on dfk.detachmentId = d.id
        join faction_keyword fk on fk.id = dfk.factionKeywordId
        where dr.hiddenFromCommandBunker = 0
          and fk.excludedFromArmyBuilder = 0
        order by lower(fk.name), lower(d.name), dr.displayOrder, lower(dr.name)
        """
    ).fetchall()
    href_by_key = codex_route_maps(builder)["detachments"]
    return [
        {
            "type": "Detachment Rule",
            "title": row["name"],
            "meta": compact_text(row["factionName"], row["detachmentName"]),
            "text": row["componentText"],
            "href": href_by_key[(row["factionId"], row["detachmentId"])],
        }
        for row in rows
        if (row["factionId"], row["detachmentId"]) in href_by_key
    ]

def search_enhancement_items(builder, conn):
    rows = conn.execute(
        """
        select e.id, e.name, e.rules, e.lore, e.basePointsCost, e.enhancementType,
               d.id as detachmentId, d.name as detachmentName,
               fk.id as factionId, fk.name as factionName,
               (
                 select group_concat(
                   coalesce(f.errataHeader, '') || ' ' ||
                   coalesce(f.errataText, '') || ' ' ||
                   coalesce(f.question, '') || ' ' ||
                   coalesce(f.answer, ''),
                   ' '
                 )
                 from faq_config fc
                 join faq f on f.id = fc.faqId
                 where fc.enhancementId = e.id
               ) as faqText
        from enhancement e
        join detachment d on d.id = e.detachmentId
        join detachment_faction_keyword dfk on dfk.detachmentId = d.id
        join faction_keyword fk on fk.id = dfk.factionKeywordId
        where fk.excludedFromArmyBuilder = 0
        order by lower(fk.name), lower(d.name), e.displayOrder, lower(e.name)
        """
    ).fetchall()
    href_by_key = codex_route_maps(builder)["detachments"]
    return [
        {
            "type": "Enhancement",
            "title": row["name"],
            "meta": compact_text(row["factionName"], row["detachmentName"]),
            "text": compact_text(
                row["rules"],
                row["lore"],
                row["basePointsCost"],
                row["enhancementType"],
                row["faqText"],
            ),
            "href": href_by_key[(row["factionId"], row["detachmentId"])],
        }
        for row in rows
        if (row["factionId"], row["detachmentId"]) in href_by_key
    ]

def search_detachment_stratagem_items(builder, conn):
    rows = conn.execute(
        """
        select s.id, s.name, s.lore, s.whenRules, s.targetRules, s.effectRules,
               s.restrictionRules, s.cpCost, s.category, s.secondaryEffect,
               d.id as detachmentId, d.name as detachmentName,
               fk.id as factionId, fk.name as factionName,
               (
                 select group_concat(
                   coalesce(f.errataHeader, '') || ' ' ||
                   coalesce(f.errataText, '') || ' ' ||
                   coalesce(f.question, '') || ' ' ||
                   coalesce(f.answer, ''),
                   ' '
                 )
                 from faq_config fc
                 join faq f on f.id = fc.faqId
                 where fc.stratagemId = s.id
               ) as faqText
        from stratagem s
        join detachment d on d.id = s.detachmentId
        join detachment_faction_keyword dfk on dfk.detachmentId = d.id
        join faction_keyword fk on fk.id = dfk.factionKeywordId
        where fk.excludedFromArmyBuilder = 0
        order by lower(fk.name), lower(d.name), s.displayOrder, lower(s.name)
        """
    ).fetchall()
    href_by_key = codex_route_maps(builder)["detachments"]
    return [
        {
            "type": "Stratagem",
            "title": row["name"],
            "meta": compact_text(row["factionName"], row["detachmentName"], row["cpCost"], row["category"]),
            "text": compact_text(
                row["lore"],
                row["whenRules"],
                row["targetRules"],
                row["effectRules"],
                row["restrictionRules"],
                row["secondaryEffect"],
                row["faqText"],
            ),
            "href": href_by_key[(row["factionId"], row["detachmentId"])],
        }
        for row in rows
        if (row["factionId"], row["detachmentId"]) in href_by_key
    ]
