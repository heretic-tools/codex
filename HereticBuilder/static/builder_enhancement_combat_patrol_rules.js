import { unitIdsScope } from "./builder_enhancement_limit_scopes.js";
import {
  combatPatrolDefaultEnhancements,
  selectedEnhancementTargetsById,
} from "./builder_enhancement_combat_patrol_defaults.js";
import { validationMessage } from "./builder_validation_messages.js";

function validateCombatPatrolEnhancements(detachments, selected, messages) {
  const combatPatrols = detachments.filter((detachment) => detachment.isCombatPatrol);
  if (!combatPatrols.length) {
    return;
  }
  const selectedById = selectedEnhancementTargetsById(selected);
  for (const detachment of combatPatrols) {
    const defaults = combatPatrolDefaultEnhancements(detachment);
    const defaultIds = new Set(defaults.map((enhancement) => enhancement.id));
    for (const enhancement of defaults) {
      const selectedDefaults = selectedById.get(enhancement.id) || [];
      const count = selectedDefaults.length;
      if (count === 0) {
        messages.push(validationMessage(
          "enhancement.combat_patrol_required",
          `${detachment.name} requires ${enhancement.name} as its Combat Patrol enhancement.`,
          "error",
          { detachmentId: detachment.id }
        ));
      } else if (count > 1) {
        messages.push(validationMessage(
          "enhancement.combat_patrol_multiple_selected",
          `${enhancement.name} selected ${count} times; Combat Patrol requires it exactly once.`,
          "error",
          unitIdsScope(selectedDefaults)
        ));
      }
    }
    for (const item of selected) {
      if (item.enhancement.detachmentId === detachment.id && !defaultIds.has(item.enhancement.id)) {
        messages.push(validationMessage(
          "enhancement.combat_patrol_not_allowed",
          `${item.enhancement.name} is not the Combat Patrol enhancement for ${detachment.name}.`,
          "error",
          unitIdsScope([item])
        ));
      }
    }
  }
}

export { validateCombatPatrolEnhancements };
