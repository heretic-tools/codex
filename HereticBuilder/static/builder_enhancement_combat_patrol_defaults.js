import { state } from "./builder_state.js";

function combatPatrolDefaultEnhancements(detachment) {
  return state.catalog.enhancements.filter((enhancement) => (
    enhancement.detachmentId === detachment.id && enhancement.isCombatPatrolDefault
  ));
}

function selectedEnhancementTargetsById(selected) {
  const selectedById = new Map();
  for (const item of selected) {
    if (!selectedById.has(item.enhancement.id)) {
      selectedById.set(item.enhancement.id, []);
    }
    selectedById.get(item.enhancement.id).push(item);
  }
  return selectedById;
}

export {
  combatPatrolDefaultEnhancements,
  selectedEnhancementTargetsById,
};
