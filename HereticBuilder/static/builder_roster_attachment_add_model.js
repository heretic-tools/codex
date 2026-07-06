import { attachmentMembers } from "./builder_roster_attachment_members.js";

function attachmentWithAddedMember(attachment, attachedUnitId, attachmentType) {
  return {
    ...attachment,
    members: [
      ...attachmentMembers(attachment),
      { rosterUnitId: attachedUnitId, attachmentType },
    ],
  };
}

function newAttachmentGroup({ attachedUnitId, attachmentId, attachmentType, bodyguardUnitId }) {
  return {
    id: attachmentId,
    members: [
      { rosterUnitId: attachedUnitId, attachmentType },
      { rosterUnitId: bodyguardUnitId, attachmentType: "bodyguard" },
    ],
  };
}

export { attachmentWithAddedMember, newAttachmentGroup };
