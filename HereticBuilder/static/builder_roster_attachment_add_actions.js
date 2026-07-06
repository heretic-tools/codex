import { withModifiedRoster } from "./builder_roster_action_helpers.js";
import { rosterUnitSummaries } from "./builder_model.js";
import { attachmentPairFailures } from "./builder_roster_attachment_failures.js";
import {
  attachmentWithAddedMember,
  newAttachmentGroup,
} from "./builder_roster_attachment_add_model.js";
import {
  attachmentHasBodyguard,
  unitHasAttachmentMembership,
} from "./builder_roster_attachment_members.js";

function attachmentPairCanBeAdded(roster, units, {
  attachedUnitId,
  attachmentType,
  bodyguardUnitId,
}) {
  const resolvedUnits = units ?? rosterUnitSummaries(roster);
  const attachedUnit = resolvedUnits.find((unit) => unit.id === attachedUnitId);
  const bodyguardUnit = resolvedUnits.find((unit) => unit.id === bodyguardUnitId);
  if (!attachedUnit || !bodyguardUnit) {
    return false;
  }
  return !attachmentPairFailures(roster, attachedUnit, bodyguardUnit, attachmentType).length;
}

function rosterWithAddedAttachment(roster, {
  attachedUnitId,
  attachmentId,
  attachmentType = "leader",
  bodyguardUnitId,
  units = null,
}) {
  if (!attachedUnitId || !bodyguardUnitId || attachedUnitId === bodyguardUnitId) {
    return roster;
  }
  if (!["leader", "support"].includes(attachmentType)) {
    return roster;
  }
  if (!attachmentPairCanBeAdded(roster, units, { attachedUnitId, attachmentType, bodyguardUnitId })) {
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
        return attachmentWithAddedMember(attachment, attachedUnitId, attachmentType);
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
      newAttachmentGroup({ attachedUnitId, attachmentId, attachmentType, bodyguardUnitId }),
    ],
  });
}

export { rosterWithAddedAttachment };
