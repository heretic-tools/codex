import { miniatureKeywordIds, unique } from "./builder_model.js";
import { enhancementCandidateStatus } from "./builder_enhancement_rules.js";
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

function enhancementSelectRows({
  currentId = "",
  enhancements,
  keywordIds,
  miniature,
  roster,
  targetKind,
  unit,
  units,
}) {
  const detachments = (roster.detachmentIds || []).map((id) => ({ id, ...state.catalog.detachmentById.get(id) }));
  return enhancements.map((enhancement, index) => {
    const status = enhancementCandidateStatus({
      roster,
      detachments,
      units,
      unit,
      enhancement,
      keywordIds,
      miniature,
      targetKind,
    });
    return {
      disabled: !status.eligible && enhancement.id !== currentId,
      enhancement,
      index,
      status,
    };
  }).sort((left, right) => Number(right.status.eligible) - Number(left.status.eligible) || left.index - right.index);
}

export {
  currentMiniatureEnhancementId,
  enhancementOptionsFor,
  enhancementSelectRows,
  miniatureEnhancementKeywordIds,
};
