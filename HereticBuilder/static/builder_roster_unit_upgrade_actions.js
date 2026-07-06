import { updateRosterUnit } from "./builder_roster_action_helpers.js";
export { rosterWithWarlord } from "./builder_roster_warlord_actions.js";

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

export {
  rosterWithMiniatureEnhancement,
  rosterWithUnitAllegianceAbility,
  rosterWithUnitEnhancement,
};
