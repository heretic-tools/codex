import { allegianceAbilityCandidateStatus } from "./builder_allegiance_rules.js";
import { enhancementCandidateStatus } from "./builder_enhancement_rules.js";
import { updateRosterUnit } from "./builder_roster_action_helpers.js";
import { state } from "./builder_state.js";
export { rosterWithWarlord } from "./builder_roster_warlord_actions.js";

function enhancementCanBeSelected(roster, {
  detachments = null,
  enhancementId = "",
  keywordIds = null,
  miniature = null,
  targetKind = "unit",
  unit = null,
  unitId = "",
  units = null,
}) {
  if (!enhancementId) {
    return true;
  }
  if (!units || !detachments || !unit || !keywordIds) {
    return true;
  }
  const targetUnit = unit.id === unitId
    ? unit
    : units.find((item) => item.id === unitId);
  const enhancement = state.catalog.enhancementById.get(enhancementId);
  if (!targetUnit || !enhancement) {
    return false;
  }
  return enhancementCandidateStatus({
    roster,
    detachments,
    units,
    unit: targetUnit,
    enhancement,
    keywordIds,
    miniature,
    targetKind,
  }).eligible;
}

function rosterWithUnitEnhancement(roster, unitId, enhancementId, context = {}) {
  if (!enhancementCanBeSelected(roster, {
    ...context,
    enhancementId,
    targetKind: "unit",
    unitId,
  })) {
    return roster;
  }
  return updateRosterUnit(roster, unitId, (unit) => ({
    ...unit,
    unitEnhancements: enhancementId ? [{ id: enhancementId }] : [],
  }));
}

function allegianceAbilityCanBeSelected(roster, unitId, allegianceAbilityId, {
  detachments = null,
  unit = null,
  units = null,
} = {}) {
  if (!allegianceAbilityId) {
    return true;
  }
  if (!units || !detachments || !unit) {
    return true;
  }
  const targetUnit = unit.id === unitId
    ? unit
    : units.find((item) => item.id === unitId);
  const ability = state.catalog.allegianceAbilityById.get(allegianceAbilityId);
  if (!targetUnit || !ability) {
    return false;
  }
  return allegianceAbilityCandidateStatus({
    ability,
    detachments,
    roster,
    unit: targetUnit,
    units,
  }).eligible;
}

function rosterWithUnitAllegianceAbility(roster, unitId, allegianceAbilityId, context = {}) {
  if (!allegianceAbilityCanBeSelected(roster, unitId, allegianceAbilityId, context)) {
    return roster;
  }
  return updateRosterUnit(roster, unitId, (unit) => ({
    ...unit,
    allegianceAbilities: allegianceAbilityId ? [{ id: allegianceAbilityId }] : [],
  }));
}

function rosterWithMiniatureEnhancement(roster, unitId, {
  enhancementId,
  rosterUnitMiniatureId,
  ...context
}) {
  if (!rosterUnitMiniatureId) {
    return roster;
  }
  if (!enhancementCanBeSelected(roster, {
    ...context,
    enhancementId,
    targetKind: "miniature",
    unitId,
  })) {
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
  allegianceAbilityCanBeSelected,
  enhancementCanBeSelected,
  rosterWithMiniatureEnhancement,
  rosterWithUnitAllegianceAbility,
  rosterWithUnitEnhancement,
};
