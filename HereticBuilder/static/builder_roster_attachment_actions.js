function withModifiedRoster(roster, fields) {
  return {
    ...roster,
    ...fields,
  };
}

function attachmentMembers(attachment) {
  return Array.isArray(attachment.members) ? attachment.members : [];
}

function attachmentHasUnit(attachment, unitId) {
  return attachmentMembers(attachment).some((member) => member.rosterUnitId === unitId);
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

export {
  attachmentHasUnit,
  rosterWithAddedAttachment,
  rosterWithRemovedAttachment,
  rosterWithRemovedAttachmentMember,
};
