import { validateSelectedEnhancementBaseTarget } from "./builder_enhancement_selected_base_rules.js";
import { validateSelectedEnhancementRequirements } from "./builder_enhancement_selected_requirement_rules.js";

function validateSelectedEnhancementTarget(roster, detachmentIds, units, item, messages) {
  validateSelectedEnhancementBaseTarget(detachmentIds, item, messages);
  validateSelectedEnhancementRequirements(roster, units, item, messages);
}

export { validateSelectedEnhancementTarget };
