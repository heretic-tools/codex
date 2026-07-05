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
    unitEnhancements: [],
    miniatureEnhancements: [],
    miniatures: defaultRosterMiniatures(unitId, datasheetId, composition.id),
  };
  return withModifiedRoster(roster, {
    units: [...(roster.units || []), unit],
  });
}

function updateRosterUnit(roster, unitId, callback) {
  return withModifiedRoster(roster, {
    units: (roster.units || []).map((unit) => (
      unit.id === unitId ? callback(unit) : unit
    )),
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

function attachmentMembers(attachment) {
  return Array.isArray(attachment.members) ? attachment.members : [];
}

function attachmentHasUnit(attachment, unitId) {
  if (attachmentMembers(attachment).some((member) => member.rosterUnitId === unitId)) {
    return true;
  }
  return attachment.leaderUnitId === unitId
    || attachment.bodyguardUnitId === unitId
    || attachment.attachedUnitId === unitId
    || attachment.targetUnitId === unitId;
}

function attachmentHasBodyguard(attachment, bodyguardUnitId) {
  return attachmentMembers(attachment).some((member) => (
    member.rosterUnitId === bodyguardUnitId && member.attachmentType === "bodyguard"
  ));
}

function unitHasAttachmentMembership(roster, unitId) {
  return (roster.attachments || []).some((attachment) => attachmentHasUnit(attachment, unitId));
}

function rosterWithAddedAttachment(roster, {
  attachedUnitId,
  attachmentId,
  attachmentType = "leader",
  bodyguardUnitId,
}) {
  if (!attachedUnitId || !bodyguardUnitId || attachedUnitId === bodyguardUnitId) {
    return roster;
  }
  if (!["leader", "support"].includes(attachmentType)) {
    return roster;
  }
  if (unitHasAttachmentMembership(roster, attachedUnitId)) {
    return roster;
  }

  const attachments = roster.attachments || [];
  const bodyguardGroup = attachments.find((attachment) => attachmentHasBodyguard(attachment, bodyguardUnitId));
  if (bodyguardGroup) {
    return withModifiedRoster(roster, {
      attachments: attachments.map((attachment) => {
        if (attachment.id !== bodyguardGroup.id) {
          return attachment;
        }
        return {
          ...attachment,
          members: [
            ...attachmentMembers(attachment),
            { rosterUnitId: attachedUnitId, attachmentType },
          ],
        };
      }),
    });
  }
  if (unitHasAttachmentMembership(roster, bodyguardUnitId)) {
    return roster;
  }
  if (!attachmentId) {
    return roster;
  }
  return withModifiedRoster(roster, {
    attachments: [
      ...attachments,
      {
        id: attachmentId,
        members: [
          { rosterUnitId: attachedUnitId, attachmentType },
          { rosterUnitId: bodyguardUnitId, attachmentType: "bodyguard" },
        ],
      },
    ],
  });
}

function rosterWithRemovedAttachment(roster, attachmentId) {
  if (!attachmentId) {
    return roster;
  }
  return withModifiedRoster(roster, {
    attachments: (roster.attachments || []).filter((attachment) => attachment.id !== attachmentId),
  });
}

function rosterWithRemovedAttachmentMember(roster, attachmentId, rosterUnitId) {
  if (!attachmentId || !rosterUnitId) {
    return roster;
  }
  const attachments = [];
  for (const attachment of roster.attachments || []) {
    if (attachment.id !== attachmentId) {
      attachments.push(attachment);
      continue;
    }
    const members = attachmentMembers(attachment).filter((member) => member.rosterUnitId !== rosterUnitId);
    const hasBodyguard = members.some((member) => member.attachmentType === "bodyguard");
    const hasAttached = members.some((member) => member.attachmentType === "leader" || member.attachmentType === "support");
    if (members.length >= 2 && hasBodyguard && hasAttached) {
      attachments.push({ ...attachment, members });
    }
  }
  return withModifiedRoster(roster, { attachments });
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

function withWargearCount(wargear, optionId, count) {
  const next = { ...(wargear || {}) };
  const value = Math.max(0, Number(count || 0));
  if (value) {
    next[optionId] = value;
  } else {
    delete next[optionId];
  }
  return next;
}

function rosterWithUnitWargearCount(roster, unitId, { optionId, count, rosterUnitMiniatureId = "" }) {
  if (!optionId) {
    return roster;
  }
  return updateRosterUnit(roster, unitId, (unit) => {
    if (!rosterUnitMiniatureId) {
      return {
        ...unit,
        wargear: withWargearCount(unit.wargear, optionId, count),
      };
    }
    return {
      ...unit,
      miniatures: (unit.miniatures || []).map((miniature) => {
        const targetId = miniature.rosterUnitMiniatureId || miniature.id;
        if (targetId !== rosterUnitMiniatureId) {
          return miniature;
        }
        return {
          ...miniature,
          wargear: withWargearCount(miniature.wargear, optionId, count),
        };
      }),
    };
  });
}

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

function rosterWithUnitEnhancement(roster, unitId, enhancementId) {
  return updateRosterUnit(roster, unitId, (unit) => ({
    ...unit,
    unitEnhancements: enhancementId ? [{ id: enhancementId }] : [],
  }));
}

function rosterWithUnitAllegianceAbility(roster, unitId, allegianceAbilityId) {
  return updateRosterUnit(roster, unitId, (unit) => ({
    ...unit,
    allegianceAbilities: allegianceAbilityId ? [{ id: allegianceAbilityId }] : [],
  }));
}

function rosterWithMiniatureEnhancement(roster, unitId, { enhancementId, rosterUnitMiniatureId }) {
  if (!rosterUnitMiniatureId) {
    return roster;
  }
  return updateRosterUnit(roster, unitId, (unit) => {
    const miniatureEnhancements = (unit.miniatureEnhancements || []).filter((enhancement) => (
      enhancement.targetId !== rosterUnitMiniatureId
    ));
    if (enhancementId) {
      miniatureEnhancements.push({ id: enhancementId, targetId: rosterUnitMiniatureId });
    }
    return {
      ...unit,
      miniatureEnhancements,
    };
  });
}

function rosterWithWarlord(roster, { rosterUnitMiniatureId = "", unitId = "" }) {
  return withModifiedRoster(roster, {
    units: (roster.units || []).map((unit) => ({
      ...unit,
      miniatures: (unit.miniatures || []).map((miniature) => {
        const targetId = miniature.rosterUnitMiniatureId || miniature.id;
        return {
          ...miniature,
          isWarlord: Boolean(unitId && rosterUnitMiniatureId && unit.id === unitId && targetId === rosterUnitMiniatureId),
        };
      }),
    })),
  });
}

export {
  rosterWithAddedAttachment,
  rosterWithAddedDetachment,
  rosterWithAddedUnit,
  rosterWithMiniatureEnhancement,
  rosterWithRemovedAttachment,
  rosterWithRemovedAttachmentMember,
  rosterWithRemovedDetachment,
  rosterWithRemovedUnit,
  rosterWithUnitAllegianceAbility,
  rosterWithUnitDefaultWargear,
  rosterWithUnitEnhancement,
  rosterWithUnitComposition,
  rosterWithUnitWargearCount,
  rosterWithWarlord,
};
