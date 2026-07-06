import { allegianceAbilityCandidateStatus } from "./builder_allegiance_rules.js";
import { rosterUnitSummaries } from "./builder_model.js";
import { updateRosterUnit } from "./builder_roster_action_helpers.js";
import { state } from "./builder_state.js";

function allegianceActionContext(roster, unitId, {
  detachments = null,
  unit = null,
  units = null,
} = {}) {
  const resolvedUnits = units ?? rosterUnitSummaries(roster);
  const resolvedUnit = unit?.id === unitId
    ? unit
    : resolvedUnits.find((item) => item.id === unitId);
  return {
    detachments: detachments ?? (roster.detachmentIds || [])
      .map((id) => state.catalog.detachmentById.get(id))
      .filter(Boolean),
    unit: resolvedUnit,
    units: resolvedUnits,
  };
}

function allegianceAbilityCanBeSelected(roster, unitId, allegianceAbilityId, {
  detachments = null,
  unit = null,
  units = null,
} = {}) {
  if (!allegianceAbilityId) {
    return true;
  }
  const context = allegianceActionContext(roster, unitId, { detachments, unit, units });
  const ability = state.catalog.allegianceAbilityById.get(allegianceAbilityId);
  if (!context.unit || !ability) {
    return false;
  }
  return allegianceAbilityCandidateStatus({
    ability,
    detachments: context.detachments,
    roster,
    unit: context.unit,
    units: context.units,
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
