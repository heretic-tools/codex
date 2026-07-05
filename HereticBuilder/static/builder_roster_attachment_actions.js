import { withModifiedRoster } from "./builder_roster_action_helpers.js";
import {
  attachmentHasBodyguard,
  attachmentHasUnit,
  attachmentMembers,
  unitHasAttachmentMembership,
} from "./builder_roster_attachment_members.js";
export {
  rosterWithRemovedAttachment,
  rosterWithRemovedAttachmentMember,
} from "./builder_roster_attachment_remove_actions.js";

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

export {
  attachmentHasUnit,
  rosterWithAddedAttachment,
};
