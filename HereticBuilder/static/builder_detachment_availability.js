import { state } from "./builder_state.js";

function availableDetachments(factionKeywordId) {
  const allowedIds = new Set(
    state.catalog.detachmentFactionKeywords
      .filter((row) => row.factionKeywordId === factionKeywordId)
      .map((row) => row.detachmentId)
  );
  return state.catalog.detachments
    .filter((detachment) => allowedIds.has(detachment.id) && !detachment.isCombatPatrol)
    .sort((left, right) => (
      (left.displayOrder || 0) - (right.displayOrder || 0)
      || String(left.name || "").localeCompare(String(right.name || ""))
    ));
}

function detachmentAllowed(detachmentId, factionKeywordId) {
  return state.catalog.detachmentFactionKeywords.some((row) => (
    row.detachmentId === detachmentId && row.factionKeywordId === factionKeywordId
  ));
}

export {
  availableDetachments,
  detachmentAllowed,
};
