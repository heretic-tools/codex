import {
  compositionFactionIds,
  datasheetAvailableToRoster,
  defaultComposition,
  defaultWargear,
} from "./builder_model.js";
import { defaultRosterMiniatures } from "./builder_roster_unit_default_rows.js";

function defaultRosterUnitForDatasheet(roster, { allyType = "native", datasheetId, unitId }) {
  if (!datasheetId || !unitId) {
    return null;
  }
  if (!datasheetAvailableToRoster(roster, allyType, datasheetId)) {
    return null;
  }
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = defaultComposition(datasheetId, factionIds, roster.detachmentIds || []);
  if (!composition) {
    return null;
  }
  return {
    id: unitId,
    allyType,
    datasheetId,
    compositionId: composition.id,
    wargear: defaultWargear(datasheetId, composition.id),
    unitEnhancements: [],
    miniatureEnhancements: [],
    miniatures: defaultRosterMiniatures(unitId, datasheetId, composition.id),
  };
}

export { defaultRosterUnitForDatasheet };
