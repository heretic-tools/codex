import { validateCombatPatrolEnhancements } from "./builder_enhancement_combat_patrol_rules.js";
import { unitIdsScope } from "./builder_enhancement_limit_scopes.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";

function validateEnhancementSelectionLimits(roster, selected, messages) {
  const included = selected.filter((item) => item.enhancement.isIncludedInEnhancementLimit);
  const limit = state.catalog.battleSizeById.get(roster.battleSizeId)?.enhancementLimit || 0;
  if (limit && included.length > limit) {
    messages.push(validationMessage(
      "enhancement.roster_has_too_many_enhancements",
      `Roster has ${included.length} enhancements; limit is ${limit}.`,
      "error",
      unitIdsScope(included)
    ));
  }
  const byEnhancement = new Map();
  for (const item of selected) {
    if (!byEnhancement.has(item.enhancement.id)) {
      byEnhancement.set(item.enhancement.id, []);
    }
    byEnhancement.get(item.enhancement.id).push(item);
  }
  for (const [enhancementId, items] of byEnhancement.entries()) {
    const enhancement = state.catalog.enhancementById.get(enhancementId);
    if (enhancement?.limit != null && items.length > enhancement.limit) {
      messages.push(validationMessage(
        "enhancement.models_have_same_enhancements",
        `${enhancement.name} selected ${items.length} times; limit is ${enhancement.limit}.`,
        "error",
        unitIdsScope(items)
      ));
    }
  }
}

export {
  validateCombatPatrolEnhancements,
  validateEnhancementSelectionLimits,
};
