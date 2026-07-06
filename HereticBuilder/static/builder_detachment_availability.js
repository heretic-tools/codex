import { state } from "./builder_state.js";

function detachmentAllowed(detachmentId, factionKeywordId) {
  return state.catalog.detachmentFactionKeywords.some((row) => (
    row.detachmentId === detachmentId && row.factionKeywordId === factionKeywordId
  ));
}

function detachmentAvailableToRoster(detachmentId, factionKeywordId) {
  const detachment = state.catalog.detachmentById.get(detachmentId);
  return Boolean(detachment)
    && !detachment.isCombatPatrol
    && detachmentAllowed(detachmentId, factionKeywordId);
}

function availableDetachments(factionKeywordId) {
  return state.catalog.detachments
    .filter((detachment) => detachmentAvailableToRoster(detachment.id, factionKeywordId))
    .sort((left, right) => (
      (left.displayOrder || 0) - (right.displayOrder || 0)
      || String(left.name || "").localeCompare(String(right.name || ""))
    ));
}

export {
  availableDetachments,
  detachmentAllowed,
  detachmentAvailableToRoster,
};
