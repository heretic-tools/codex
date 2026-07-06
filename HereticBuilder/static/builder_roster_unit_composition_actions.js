import {
  compositionFactionIds,
  compositionIsAvailable,
  defaultWargear,
} from "./builder_model.js";
import { updateRosterUnit } from "./builder_roster_action_helpers.js";
import { defaultRosterMiniatures } from "./builder_roster_unit_default_rows.js";
import { state } from "./builder_state.js";

function unitCompositionCanBeSelected(roster, unitId, compositionId) {
  if (!compositionId) {
    return false;
  }
  const unit = (roster.units || []).find((item) => item.id === unitId);
  if (!unit) {
    return false;
  }
  if (unit.compositionId === compositionId) {
    return true;
  }
  const composition = state.catalog.compositionById.get(compositionId);
  if (!composition || composition.datasheetId !== unit.datasheetId) {
    return false;
  }
  const factionIds = compositionFactionIds(roster, unit.allyType || "native");
  return compositionIsAvailable(composition, factionIds, roster.detachmentIds || []);
}

function rosterWithUnitComposition(roster, unitId, compositionId) {
  if (!unitCompositionCanBeSelected(roster, unitId, compositionId)) {
    return roster;
  }
  return updateRosterUnit(roster, unitId, (unit) => {
    if (unit.compositionId === compositionId) {
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

export { rosterWithUnitComposition, unitCompositionCanBeSelected };
