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

export {
  attachmentHasBodyguard,
  attachmentHasUnit,
  attachmentMembers,
  unitHasAttachmentMembership,
};
