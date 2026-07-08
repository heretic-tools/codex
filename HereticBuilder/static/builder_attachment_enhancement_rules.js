import { selectedMiniatureEnhancements, selectedUnitEnhancements } from "./builder_model.js";
import { attachedUnitSentenceLabel } from "./builder_attachment_validation_messages.js";
import { validationMessage } from "./builder_validation_messages.js";
import { attachedGroups } from "./builder_attachment_matchers.js";
export { enhancementBodyguardRequirementSatisfied } from "./builder_attachment_enhancement_bodyguard_rules.js";

function validateAttachedUnitEnhancementLimits(roster, units, messages) {
  for (const group of attachedGroups(roster)) {
    const enhancementIds = new Set();
    for (const member of group.members || []) {
      const unit = units.find((item) => item.id === member.rosterUnitId);
      for (const enhancement of unit ? selectedUnitEnhancements(unit) : []) {
        enhancementIds.add(enhancement.id);
      }
      for (const enhancement of unit ? selectedMiniatureEnhancements(unit) : []) {
        enhancementIds.add(enhancement.id);
      }
    }
    if (enhancementIds.size > 1) {
      messages.push(validationMessage(
        "enhancement.attached_unit_too_many_enhancements",
        `${attachedUnitSentenceLabel(group, units)} has more than 1 enhancement.`,
        "error",
        {
          attachmentId: group.id,
          unitIds: (group.members || []).map((member) => member.rosterUnitId).filter(Boolean),
        }
      ));
    }
  }
}

export {
  validateAttachedUnitEnhancementLimits,
};
