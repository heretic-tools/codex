import {
  compositionFactionIds,
  defaultComposition,
  defaultMiniatures,
  defaultWargear,
} from "./builder_model.js";

function withModifiedRoster(roster, fields) {
  return {
    ...roster,
    ...fields,
  };
}

function rosterWithAddedDetachment(roster, detachmentId) {
  if (!detachmentId || (roster.detachmentIds || []).includes(detachmentId)) {
    return roster;
  }
  return withModifiedRoster(roster, {
    detachmentIds: [...(roster.detachmentIds || []), detachmentId],
  });
}

function rosterWithRemovedDetachment(roster, index) {
  const detachmentIds = [...(roster.detachmentIds || [])];
  if (index < 0 || index >= detachmentIds.length) {
    return roster;
  }
  detachmentIds.splice(index, 1);
  return withModifiedRoster(roster, { detachmentIds });
}

function defaultRosterMiniatures(unitId, datasheetId, compositionId) {
  return defaultMiniatures(datasheetId, compositionId).map((miniature, index) => ({
    ...miniature,
    id: `${unitId}:${miniature.miniatureId}:${index}`,
    rosterUnitMiniatureId: `${unitId}:${miniature.miniatureId}:${index}`,
  }));
}

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
      attachment.leaderUnitId !== unitId
      && attachment.bodyguardUnitId !== unitId
      && attachment.attachedUnitId !== unitId
      && attachment.targetUnitId !== unitId
    )),
    units: (roster.units || []).filter((unit) => unit.id !== unitId),
  });
}

export {
  rosterWithAddedDetachment,
  rosterWithAddedUnit,
  rosterWithRemovedDetachment,
  rosterWithRemovedUnit,
};
