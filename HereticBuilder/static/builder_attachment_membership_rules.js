import { unitValidationMessage } from "./builder_validation_messages.js";

function attachmentMembership(groups) {
  const membership = new Map();
  for (const group of groups) {
    for (const member of group.members || []) {
      if (!membership.has(member.rosterUnitId)) {
        membership.set(member.rosterUnitId, new Set());
      }
      membership.get(member.rosterUnitId).add(group.id);
    }
  }
  return membership;
}

function validateAttachmentDuplicateMembership(groups, units, messages) {
  for (const [rosterUnitId, groupIds] of attachmentMembership(groups).entries()) {
    if (groupIds.size > 1) {
      const unit = units.find((item) => item.id === rosterUnitId);
      messages.push(unitValidationMessage("attached_unit.duplicate_membership", unit, `${unit?.name || "Unit"} is part of more than one attached unit.`, {
        attachmentIds: [...groupIds],
      }));
    }
  }
}

export { validateAttachmentDuplicateMembership };
