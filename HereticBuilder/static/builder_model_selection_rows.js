import { state } from "./builder_state.js";

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

export {
  selectedAllegianceAbilities,
  selectedMiniatureEnhancements,
  selectedUnitEnhancements,
};
