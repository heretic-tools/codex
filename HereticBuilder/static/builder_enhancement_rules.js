import { validateAttachedUnitEnhancementLimits } from "./builder_attachment_rules.js";
import { enhancementCandidateStatus } from "./builder_enhancement_eligibility.js";
import {
  validateCombatPatrolEnhancements,
  validateEnhancementSelectionLimits,
} from "./builder_enhancement_limit_rules.js";
import { selectedEnhancementTargets } from "./builder_enhancement_selection.js";
import { validateSelectedEnhancementTarget } from "./builder_enhancement_selected_rules.js";

function validateEnhancements(roster, detachments, units, messages) {
  const detachmentIds = new Set(detachments.map((detachment) => detachment.id));
  const selected = selectedEnhancementTargets(units, messages);
  validateEnhancementSelectionLimits(roster, selected, messages);
  for (const item of selected) {
    validateSelectedEnhancementTarget(roster, detachmentIds, units, item, messages);
  }
  validateAttachedUnitEnhancementLimits(roster, units, messages);
  validateCombatPatrolEnhancements(detachments, selected, messages);
}

export { enhancementCandidateStatus, validateEnhancements };
