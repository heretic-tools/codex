import {
  updateRosterUnit,
  withModifiedRoster,
} from "./builder_roster_action_helpers.js";

function rosterWithUnitEnhancement(roster, unitId, enhancementId) {
  return updateRosterUnit(roster, unitId, (unit) => ({
    ...unit,
    unitEnhancements: enhancementId ? [{ id: enhancementId }] : [],
  }));
}

function rosterWithUnitAllegianceAbility(roster, unitId, allegianceAbilityId) {
  return updateRosterUnit(roster, unitId, (unit) => ({
    ...unit,
    allegianceAbilities: allegianceAbilityId ? [{ id: allegianceAbilityId }] : [],
  }));
}

function rosterWithMiniatureEnhancement(roster, unitId, { enhancementId, rosterUnitMiniatureId }) {
  if (!rosterUnitMiniatureId) {
    return roster;
  }
  return updateRosterUnit(roster, unitId, (unit) => {
    const miniatureEnhancements = (unit.miniatureEnhancements || []).filter((enhancement) => (
      enhancement.targetId !== rosterUnitMiniatureId
    ));
    if (enhancementId) {
      miniatureEnhancements.push({ id: enhancementId, targetId: rosterUnitMiniatureId });
    }
    return {
      ...unit,
      miniatureEnhancements,
    };
  });
}

function rosterWithWarlord(roster, { rosterUnitMiniatureId = "", unitId = "" }) {
  return withModifiedRoster(roster, {
    units: (roster.units || []).map((unit) => ({
      ...unit,
      miniatures: (unit.miniatures || []).map((miniature) => {
        const targetId = miniature.rosterUnitMiniatureId || miniature.id;
        return {
          ...miniature,
          isWarlord: Boolean(unitId && rosterUnitMiniatureId && unit.id === unitId && targetId === rosterUnitMiniatureId),
        };
      }),
    })),
  });
}

export {
  rosterWithMiniatureEnhancement,
  rosterWithUnitAllegianceAbility,
  rosterWithUnitEnhancement,
  rosterWithWarlord,
};
