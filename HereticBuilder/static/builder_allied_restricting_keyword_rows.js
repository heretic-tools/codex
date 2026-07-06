import { alliedFactionParentMatches } from "./builder_allied_rule_helpers.js";
import { state } from "./builder_state.js";

function allyRestrictingKeywordRows(alliedFactionId) {
  const rows = [];
  for (const row of state.catalog.keywordAllyRestrictingKeywords || []) {
    const keyword = state.catalog.keywordById.get(row.keywordId);
    if (alliedFactionParentMatches(alliedFactionId, keyword?.allyRestrictingFactionKeywordId)) {
      rows.push(row);
    }
  }
  for (const keyword of state.catalog.keywords || []) {
    if (!keyword.allyRestrictingKeywordId) {
      continue;
    }
    if (alliedFactionParentMatches(alliedFactionId, keyword.allyRestrictingFactionKeywordId)) {
      rows.push({
        keywordId: keyword.id,
        restrictingKeywordId: keyword.allyRestrictingKeywordId,
      });
    }
  }
  return rows;
}

export { allyRestrictingKeywordRows };
