import { unitIdsScope } from "./builder_allied_rule_helpers.js";
import { allyRestrictingKeywordRows } from "./builder_allied_restricting_keyword_rows.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";

function validateAllyRestrictingKeywords(alliedFactionId, label, units, messages) {
  const seen = new Set();
  for (const row of allyRestrictingKeywordRows(alliedFactionId)) {
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
