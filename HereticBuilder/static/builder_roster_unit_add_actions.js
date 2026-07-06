import {
  compositionFactionIds,
  datasheetAvailableToRoster,
  defaultComposition,
  defaultWargear,
  rosterUnitSummaries,
  unitSummary,
} from "./builder_model.js";
import { withModifiedRoster } from "./builder_roster_action_helpers.js";
import { defaultRosterMiniatures } from "./builder_roster_unit_default_rows.js";
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
  if (!datasheetId || !unitId) {
    return roster;
  }
  if (!datasheetAvailableToRoster(roster, allyType, datasheetId)) {
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
  if (!unitCanBeAddedToRoster(roster, unit)) {
    return roster;
  }
  return withModifiedRoster(roster, {
    units: [...(roster.units || []), unit],
  });
}

export { rosterWithAddedUnit, unitCanBeAddedToRoster };
