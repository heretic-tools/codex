import {
  rosterUnitSummaries,
  unitSummary,
} from "./builder_model.js";
import { withModifiedRoster } from "./builder_roster_action_helpers.js";
import { defaultRosterUnitForDatasheet } from "./builder_roster_unit_default_unit.js";
import { state } from "./builder_state.js";
import { duplicateLimitForUnit } from "./builder_validation_core.js";

function unitCanBeAddedToRoster(roster, unit) {
  const battleSize = state.catalog.battleSizeById.get(roster.battleSizeId);
  const candidate = unitSummary({ ...roster, units: [...(roster.units || []), unit] }, unit);
  const duplicateLimit = duplicateLimitForUnit(candidate, battleSize?.duplicateUnitLimit || 3);
  const currentCount = rosterUnitSummaries(roster)
    .filter((row) => row.datasheetId === candidate.datasheetId)
    .length;
  return currentCount < duplicateLimit;
}

function rosterWithAddedUnit(roster, { allyType = "native", datasheetId, unitId }) {
  const unit = defaultRosterUnitForDatasheet(roster, { allyType, datasheetId, unitId });
  if (!unit) {
    return roster;
  }
  if (!unitCanBeAddedToRoster(roster, unit)) {
    return roster;
  }
  return withModifiedRoster(roster, {
    units: [...(roster.units || []), unit],
  });
}

export {
  rosterWithAddedUnit,
  unitCanBeAddedToRoster,
};
