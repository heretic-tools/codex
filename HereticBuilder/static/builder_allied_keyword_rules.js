import {
  alliedFactionParentMatches,
  unitIdsScope,
} from "./builder_allied_rule_helpers.js";
import { idsFromRows, selectedAllegianceAbilities } from "./builder_model.js";
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

function validateAlliedRequiredAllegianceAbilities(alliedFactionId, label, units, messages) {
  for (const row of state.catalog.alliedFactionAllegianceAbilitiesByAlliedFactionId.get(alliedFactionId) || []) {
    const selectedIds = new Set(units.flatMap((unit) => selectedAllegianceAbilities(unit).map((ability) => ability.id)));
    if (!selectedIds.has(row.allegianceAbilityId)) {
      const ability = state.catalog.allegianceAbilityById.get(row.allegianceAbilityId);
      const group = ability ? state.catalog.allegianceAbilityGroupById.get(ability.allegianceAbilityGroupId) : null;
      messages.push(validationMessage(
        "allied_unit.required_allegiance_ability_missing",
        `${label} allies must select ${ability?.name || "required ability"} from ${group?.name || "its group"}.`,
        "error",
        unitIdsScope(units)
      ));
    }
  }
}

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

export {
  validateAlliedKeywordLimits,
  validateAlliedRequiredAllegianceAbilities,
  validateAllyRestrictingKeywords,
};
