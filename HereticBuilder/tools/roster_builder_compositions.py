from roster_builder_utils import composition_label, dict_row


class RosterCompositionMixin:
    def default_composition(self, conn, datasheet_id, faction_keyword_id=None, detachment_ids=None):
        for comp in self.compositions(conn, datasheet_id, {"factionKeywordId": faction_keyword_id}, detachment_ids or []):
            if self.composition_is_available(comp, faction_keyword_id, detachment_ids or []):
                return comp
        return None

    def composition_faction_keyword_ids(self, conn, roster_faction_keyword_id, ally_type="native"):
        if ally_type and ally_type != "native":
            parent_ids = [
                row["factionKeywordId"] for row in conn.execute(
                    """
                    select factionKeywordId
                    from allied_faction_parent_faction_keyword
                    where alliedFactionId = ?
                    order by factionKeywordId
                    """,
                    [ally_type],
                )
            ]
            if parent_ids:
                return self.faction_keyword_scopes(conn, parent_ids)
        return self.faction_keyword_scope(conn, roster_faction_keyword_id)

    def compositions(self, conn, datasheet_id, roster=None, detachment_ids=None):
        rows = conn.execute(
            """
            select *
            from unit_composition
            where datasheetId = ?
            order by isDefault desc, displayOrder
            """,
            [datasheet_id],
        ).fetchall()
        result = []
        for row in rows:
            comp = dict_row(row)
            models = [dict_row(model) for model in conn.execute(
                """
                select ucm.*, m.name
                from unit_composition_miniature ucm
                join miniature m on m.id = ucm.miniatureId
                where ucm.unitCompositionId = ?
                order by m.displayOrder, m.name
                """,
                [comp["id"]],
            )]
            comp["models"] = models
            comp["label"] = composition_label(models)
            comp["requiredFactionKeywordIds"] = [
                item["factionKeywordId"] for item in conn.execute(
                    "select factionKeywordId from unit_composition_required_faction_keyword where unitCompositionId = ?",
                    [comp["id"]],
                )
            ]
            comp["requiredDetachmentIds"] = [
                item["detachmentId"] for item in conn.execute(
                    "select detachmentId from unit_composition_required_detachment where unitCompositionId = ?",
                    [comp["id"]],
                )
            ]
            comp["available"] = self.composition_is_available(
                comp,
                (roster or {}).get("factionKeywordId"),
                detachment_ids or [],
            )
            result.append(comp)
        return result

    def composition_is_available(self, comp, faction_keyword_id, detachment_ids):
        if isinstance(faction_keyword_id, (list, tuple, set)):
            faction_keyword_ids = set(faction_keyword_id)
        elif faction_keyword_id:
            faction_keyword_ids = {faction_keyword_id}
        else:
            faction_keyword_ids = set()
        if comp.get("requiredFactionKeywordIds") and not faction_keyword_ids.intersection(comp["requiredFactionKeywordIds"]):
            return False
        if comp.get("requiredDetachmentIds") and not set(comp["requiredDetachmentIds"]).intersection(detachment_ids):
            return False
        return True
