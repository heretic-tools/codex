import { defaultWargear } from "./builder_model.js";
import { updateRosterUnit } from "./builder_roster_action_helpers.js";
import { defaultRosterMiniatures } from "./builder_roster_unit_default_rows.js";

function rosterWithUnitDefaultWargear(roster, unitId) {
  return updateRosterUnit(roster, unitId, (unit) => {
    const defaults = defaultRosterMiniatures(unit.id, unit.datasheetId, unit.compositionId);
    return {
      ...unit,
      wargear: defaultWargear(unit.datasheetId, unit.compositionId),
      miniatures: (unit.miniatures || defaults).map((miniature, index) => {
        const targetId = miniature.rosterUnitMiniatureId || miniature.id;
        const defaultMiniature = defaults.find((row) => (
          (row.rosterUnitMiniatureId || row.id) === targetId
        )) || defaults[index] || defaults.find((row) => row.miniatureId === miniature.miniatureId);
        return {
          ...miniature,
          wargear: defaultMiniature?.wargear || {},
        };
      }),
    };
  });
}

export { rosterWithUnitDefaultWargear };
