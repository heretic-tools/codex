import {
  alliedFactionParentMatches,
  unitIdsScope,
} from "./builder_allied_rule_helpers.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";

function validateAllyRestrictingKeywords(alliedFactionId, label, units, messages) {
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
  const seen = new Set();
  for (const row of rows) {
    const key = `${row.keywordId}:${row.restrictingKeywordId}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const unrestricted = units.filter((unit) => (
      (unit.keywordIds || []).includes(row.keywordId)
      && !(unit.keywordIds || []).includes(row.restrictingKeywordId)
    ));
    const restricting = units.filter((unit) => (
      (unit.keywordIds || []).includes(row.keywordId)
      && (unit.keywordIds || []).includes(row.restrictingKeywordId)
    ));
    if (unrestricted.length > restricting.length) {
      const keywordName = state.catalog.keywordById.get(row.keywordId)?.name || "keyword";
      const restrictingName = state.catalog.keywordById.get(row.restrictingKeywordId)?.name || "restricting keyword";
      messages.push(validationMessage(
        "allied_keyword_restricting_keyword.outnumbered_keywords",
        `${label} allies with ${keywordName} but not ${restrictingName} have ${unrestricted.length} units; limit is ${restricting.length}.`,
        "error",
        unitIdsScope(unrestricted)
      ));
    }
  }
}

export { validateAllyRestrictingKeywords };
