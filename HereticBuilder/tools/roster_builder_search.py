from roster_builder_search_core import MAX_SEARCH_LIMIT, compact_text, match_results
import roster_builder_search_items as search_items


class RosterSearchMixin:
    def search(self, query, limit=30):
        try:
            limit = int(limit)
        except (TypeError, ValueError):
            limit = 30
        limit = max(1, min(limit, MAX_SEARCH_LIMIT))
        query_text = compact_text(query)
        if not query_text:
            return {"query": "", "results": []}

        with self.connect(readonly=True) as conn:
            items = []
            items.extend(self.search_static_items(conn))
            items.extend(self.search_faction_items(conn))
            items.extend(self.search_core_rule_items(conn))
            items.extend(self.search_army_rule_items(conn))
            items.extend(self.search_datasheet_items(conn))
            items.extend(self.search_detachment_items(conn))
            items.extend(self.search_detachment_rule_items(conn))
            items.extend(self.search_enhancement_items(conn))
            items.extend(self.search_detachment_stratagem_items(conn))

        return {
            "query": query_text,
            "results": match_results(items, query_text, limit),
        }

    def search_static_items(self, conn):
        return search_items.search_static_items(self, conn)

    def search_faction_items(self, conn):
        return search_items.search_faction_items(self, conn)

    def search_core_rule_items(self, conn):
        return search_items.search_core_rule_items(self, conn)

    def search_army_rule_items(self, conn):
        return search_items.search_army_rule_items(self, conn)

    def search_datasheet_items(self, conn):
        return search_items.search_datasheet_items(self, conn)

    def search_detachment_items(self, conn):
        return search_items.search_detachment_items(self, conn)

    def search_detachment_rule_items(self, conn):
        return search_items.search_detachment_rule_items(self, conn)

    def search_enhancement_items(self, conn):
        return search_items.search_enhancement_items(self, conn)

    def search_detachment_stratagem_items(self, conn):
        return search_items.search_detachment_stratagem_items(self, conn)
