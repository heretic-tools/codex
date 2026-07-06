import { miniatureKeywordIds, unique } from "./builder_model.js";
import { state } from "./builder_state.js";

function sortEnhancements(rows) {
  return [...rows].sort((left, right) => {
    const leftDetachment = state.catalog.detachmentById.get(left.detachmentId)?.name || "";
    const rightDetachment = state.catalog.detachmentById.get(right.detachmentId)?.name || "";
    return leftDetachment.localeCompare(rightDetachment)
      || String(left.name || "").localeCompare(String(right.name || ""));
  });
}

function enhancementOptionsFor(roster, targetKind, currentId = "") {
  const detachmentIds = new Set(roster.detachmentIds || []);
  const rows = (state.catalog.enhancements || []).filter((enhancement) => (
    (!enhancement.detachmentId || detachmentIds.has(enhancement.detachmentId))
    && (targetKind === "miniature"
      ? enhancement.enhancementType === "miniature"
      : enhancement.enhancementType !== "miniature")
  ));
  const current = state.catalog.enhancementById.get(currentId);
  if (current && !rows.some((enhancement) => enhancement.id === current.id)) {
    rows.push(current);
  }
  return sortEnhancements(rows);
}

function currentMiniatureEnhancementId(unit, rosterUnitMiniatureId) {
  return (unit.miniatureEnhancements || []).find((enhancement) => (
    enhancement.targetId === rosterUnitMiniatureId
  ))?.id || "";
}

function miniatureEnhancementKeywordIds(unit, miniature) {
  return unique([
    ...miniatureKeywordIds(miniature.miniatureId),
    ...(unit.conditionalKeywordIds || []),
  ]);
}

export {
  currentMiniatureEnhancementId,
  enhancementOptionsFor,
  miniatureEnhancementKeywordIds,
};
