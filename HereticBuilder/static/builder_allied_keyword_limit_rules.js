import { unitIdsScope } from "./builder_allied_rule_helpers.js";
import { idsFromRows } from "./builder_model.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";

function slotlessAlliedKeywordCount(alliedFactionKeywordId, units) {
  let slotless = 0;
  for (const group of state.catalog.alliedFactionKeywordSlotlessGroupsByKeywordId.get(alliedFactionKeywordId) || []) {
    const donorKeywords = new Set(idsFromRows(
      state.catalog.alliedFactionKeywordSlotlessDonorsByGroupId.get(group.id),
      "keywordId"
    ));
    const receiverKeywords = new Set(idsFromRows(
      state.catalog.alliedFactionKeywordSlotlessReceiversByGroupId.get(group.id),
      "keywordId"
    ));
    if (!donorKeywords.size || !receiverKeywords.size) {
      continue;
    }
    const donorCount = units.filter((unit) => {
      const ids = new Set(unit.keywordIds || []);
      return [...donorKeywords].every((id) => ids.has(id));
    }).length;
    const receiverCount = units.filter((unit) => {
      const ids = new Set(unit.keywordIds || []);
      return [...receiverKeywords].every((id) => ids.has(id));
    }).length;
    slotless += Math.min(donorCount, receiverCount);
  }
  return slotless;
}

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
