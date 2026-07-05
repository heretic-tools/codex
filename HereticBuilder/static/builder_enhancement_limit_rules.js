import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";

function unitIdsScope(items) {
  const unitIds = [...new Set(items.map((item) => item.unit?.id).filter(Boolean))];
  return unitIds.length ? { unitIds } : null;
}

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

function validateCombatPatrolEnhancements(detachments, selected, messages) {
  const combatPatrols = detachments.filter((detachment) => detachment.isCombatPatrol);
  if (!combatPatrols.length) {
    return;
  }
  const selectedById = new Map();
  for (const item of selected) {
    if (!selectedById.has(item.enhancement.id)) {
      selectedById.set(item.enhancement.id, []);
    }
    selectedById.get(item.enhancement.id).push(item);
  }
  for (const detachment of combatPatrols) {
    const defaults = state.catalog.enhancements.filter((enhancement) => (
      enhancement.detachmentId === detachment.id && enhancement.isCombatPatrolDefault
    ));
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

export {
  validateCombatPatrolEnhancements,
  validateEnhancementSelectionLimits,
};
