import { state } from "./builder_state.js";
import {
  factionScope,
  idsFromRows,
  unique,
} from "./builder_model_core.js";

function normalizeSelectedRows(values, byIdMap, options = {}) {
  const allowStringIds = Boolean(options.allowStringIds);
  return (values || [])
    .map((value) => {
      if (typeof value === "string") {
        if (!allowStringIds) {
          return null;
        }
        return byIdMap.get(value) || null;
      }
      if (!value || typeof value !== "object") {
        return null;
      }
      return byIdMap.get(value.id) ? { ...byIdMap.get(value.id), ...value } : value;
    })
    .filter(Boolean);
}

function compositionFactionIds(roster, allyType = "native") {
  if (allyType && allyType !== "native") {
    const parentIds = idsFromRows(
      state.catalog.alliedFactionParentsByAlliedFactionId.get(allyType),
      "factionKeywordId"
    );
    if (parentIds.length) {
      const result = [];
      for (const parentId of parentIds) {
        result.push(...factionScope(parentId));
      }
      return unique(result);
    }
  }
  return factionScope(roster.factionKeywordId);
}

function selectedAllegianceAbilities(unit) {
  return normalizeSelectedRows(unit.allegianceAbilities, state.catalog.allegianceAbilityById, { allowStringIds: true })
    .map((ability) => ({
      ...ability,
      groupId: ability.groupId || ability.allegianceAbilityGroupId,
      groupName: ability.groupName || state.catalog.allegianceAbilityGroupById.get(ability.groupId || ability.allegianceAbilityGroupId)?.name,
    }));
}

function selectedUnitEnhancements(unit) {
  return normalizeSelectedRows(unit.unitEnhancements, state.catalog.enhancementById);
}

function selectedMiniatureEnhancements(unit) {
  const direct = unit.miniatureEnhancements || [];
  return normalizeSelectedRows(direct, state.catalog.enhancementById);
}

function conditionalKeywordApplies(row, roster, detachmentIds, allegianceAbilityIds, warlordMiniatureIds) {
  if (row.requiredWarlordMiniatureId && !warlordMiniatureIds.has(row.requiredWarlordMiniatureId)) {
    return false;
  }
  if (row.requiredAllegianceAbilityId && !allegianceAbilityIds.has(row.requiredAllegianceAbilityId)) {
    return false;
  }
  if (row.requiredRosterFactionKeywordId && !factionScope(roster.factionKeywordId).includes(row.requiredRosterFactionKeywordId)) {
    return false;
  }
  if (row.requiredDetachmentId && !detachmentIds.has(row.requiredDetachmentId)) {
    return false;
  }
  return true;
}

export {
  compositionFactionIds,
  conditionalKeywordApplies,
  selectedAllegianceAbilities,
  selectedMiniatureEnhancements,
  selectedUnitEnhancements,
};
