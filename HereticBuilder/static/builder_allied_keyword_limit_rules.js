import { slotlessAlliedKeywordCount } from "./builder_allied_keyword_slotless_rules.js";
import { unitIdsScope } from "./builder_allied_rule_helpers.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";

function validateAlliedKeywordLimits(roster, alliedFactionId, label, units, warlordIds, messages) {
  let activeKeywordCounts = 0;
  for (const row of state.catalog.alliedFactionKeywordsByAlliedFactionId.get(alliedFactionId) || []) {
    if (row.battleSizeId && row.battleSizeId !== roster.battleSizeId) {
      continue;
    }
    if (row.requiredWarlordMiniatureId && !warlordIds.has(row.requiredWarlordMiniatureId)) {
      continue;
    }
    let count = units.filter((unit) => (unit.keywordIds || []).includes(row.keywordId)).length;
    count = Math.max(0, count - slotlessAlliedKeywordCount(row.id, units));
    if (count) {
      activeKeywordCounts += 1;
    }
    if (count > row.limitCount) {
      const keywordName = state.catalog.keywordById.get(row.keywordId)?.name || "keyword";
      const scopedUnits = units.filter((unit) => (unit.keywordIds || []).includes(row.keywordId));
      messages.push(validationMessage(
        "allied_keyword_count.limit_exceeded",
        `${label} allies with ${keywordName} have ${count} units; limit is ${row.limitCount}.`,
        "error",
        unitIdsScope(scopedUnits)
      ));
    }
  }
  const alliedFaction = state.catalog.alliedFactionById.get(alliedFactionId);
  if (alliedFaction?.isMutuallyExclusiveKeywordLimit && activeKeywordCounts > 1) {
    messages.push(validationMessage(
      "allied_keyword_count.invalid_mutually_exclusive_keywords",
      `${label} allied keyword limits are mutually exclusive.`,
      "error",
      unitIdsScope(units)
    ));
  }
}

export { validateAlliedKeywordLimits };
