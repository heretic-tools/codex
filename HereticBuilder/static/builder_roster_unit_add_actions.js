import {
  compositionFactionIds,
  defaultComposition,
  defaultWargear,
} from "./builder_model.js";
import { withModifiedRoster } from "./builder_roster_action_helpers.js";
import { defaultRosterMiniatures } from "./builder_roster_unit_default_rows.js";

function rosterWithAddedUnit(roster, { allyType = "native", datasheetId, unitId }) {
  if (!datasheetId || !unitId) {
    return roster;
  }
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = defaultComposition(datasheetId, factionIds, roster.detachmentIds || []);
  if (!composition) {
    return roster;
  }
  const unit = {
    id: unitId,
    allyType,
    datasheetId,
    compositionId: composition.id,
    wargear: defaultWargear(datasheetId, composition.id),
    unitEnhancements: [],
    miniatureEnhancements: [],
    miniatures: defaultRosterMiniatures(unitId, datasheetId, composition.id),
  };
  return withModifiedRoster(roster, {
    units: [...(roster.units || []), unit],
  });
}

export { rosterWithAddedUnit };
