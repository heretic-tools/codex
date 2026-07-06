import { allegianceAbilityCandidateStatus } from "./builder_allegiance_rules.js";
import { updateRosterUnit } from "./builder_roster_action_helpers.js";
import { state } from "./builder_state.js";

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

export {
  allegianceAbilityCanBeSelected,
  rosterWithUnitAllegianceAbility,
};
