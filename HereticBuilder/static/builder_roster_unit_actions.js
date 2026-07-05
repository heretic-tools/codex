import {
  compositionFactionIds,
  defaultComposition,
  defaultWargear,
} from "./builder_model.js";
import { attachmentHasUnit } from "./builder_roster_attachment_actions.js";
import {
  updateRosterUnit,
  withModifiedRoster,
} from "./builder_roster_action_helpers.js";
import { defaultRosterMiniatures } from "./builder_roster_unit_default_rows.js";
export {
  rosterWithUnitDefaultWargear,
  rosterWithUnitWargearCount,
} from "./builder_roster_unit_wargear_actions.js";
export {
  rosterWithMiniatureEnhancement,
  rosterWithUnitAllegianceAbility,
  rosterWithUnitEnhancement,
  rosterWithWarlord,
} from "./builder_roster_unit_upgrade_actions.js";

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

function rosterWithRemovedUnit(roster, unitId) {
  if (!unitId) {
    return roster;
  }
  return withModifiedRoster(roster, {
    attachments: (roster.attachments || []).filter((attachment) => (
      !attachmentHasUnit(attachment, unitId)
    )),
    units: (roster.units || []).filter((unit) => unit.id !== unitId),
  });
}

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

export {
  rosterWithAddedUnit,
  rosterWithRemovedUnit,
  rosterWithUnitComposition,
};
