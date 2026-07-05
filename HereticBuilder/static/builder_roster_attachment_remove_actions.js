import { withModifiedRoster } from "./builder_roster_action_helpers.js";
import { attachmentMembers } from "./builder_roster_attachment_members.js";

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
  rosterWithRemovedAttachment,
  rosterWithRemovedAttachmentMember,
};
