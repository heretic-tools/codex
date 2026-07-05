import { defaultWargear } from "./builder_model.js";
import { updateRosterUnit } from "./builder_roster_action_helpers.js";
import { defaultRosterMiniatures } from "./builder_roster_unit_default_rows.js";

function rosterWithUnitComposition(roster, unitId, compositionId) {
  return updateRosterUnit(roster, unitId, (unit) => {
    if (!compositionId || unit.compositionId === compositionId) {
      return unit;
    }
    return {
      ...unit,
      compositionId,
      wargear: defaultWargear(unit.datasheetId, compositionId),
      miniatureEnhancements: [],
      miniatures: defaultRosterMiniatures(unit.id, unit.datasheetId, compositionId),
    };
  });
}

export { rosterWithUnitComposition };
