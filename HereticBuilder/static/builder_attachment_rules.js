import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";
import { attachedGroups, attachedUnitCanAttach } from "./builder_attachment_matchers.js";
import { validateAttachmentDuplicateMembership } from "./builder_attachment_membership_rules.js";
export {
  enhancementBodyguardRequirementSatisfied,
  validateAttachedUnitEnhancementLimits,
} from "./builder_attachment_enhancement_rules.js";

function validateAttachedUnits(roster, detachments, units, messages) {
  const groups = attachedGroups(roster);
  if (!groups.length) {
    return;
  }
  validateAttachmentDuplicateMembership(groups, units, messages);
  const detachmentIds = detachments.map((detachment) => detachment.id);
  for (const group of groups) {
    const members = (group.members || []).map((member) => ({
      ...member,
      ...(units.find((unit) => unit.id === member.rosterUnitId) || {}),
    }));
    const bodyguards = members.filter((member) => member.attachmentType === "bodyguard");
    const attachedModels = members.filter((member) => member.attachmentType === "leader" || member.attachmentType === "support");
    if (!bodyguards.length && attachedModels.length) {
      for (const attached of attachedModels) {
        messages.push(unitValidationMessage("attached_unit.must_be_attached", attached, `${attached.name} must be attached to a bodyguard unit.`, {
          attachmentId: group.id,
        }));
      }
      continue;
    }
    if (!bodyguards.length || !attachedModels.length) {
      messages.push(validationMessage(
        "attached_unit.incomplete",
        `Attached unit ${group.id} is incomplete.`,
        "error",
        { attachmentId: group.id }
      ));
      continue;
    }
    const bodyguard = bodyguards[0];
    for (const attached of attachedModels) {
      if (!attachedUnitCanAttach(roster, detachmentIds, attached, bodyguard, units)) {
        messages.push(validationMessage(
          "attached_unit.missing_requirements",
          `${attached.name} cannot attach to ${bodyguard.name} as ${attached.attachmentType}.`,
          "error",
          {
            attachmentId: group.id,
            unitIds: [attached.id, bodyguard.id].filter(Boolean),
            datasheetIds: [attached.datasheetId, bodyguard.datasheetId].filter(Boolean),
          }
        ));
      }
    }
  }
}

export { validateAttachedUnits };
