import {
  costForDetachment,
  rosterUnitSummaries,
} from "./builder_model.js";
import { state } from "./builder_state.js";

function rosterValidationContext(roster) {
  const size = state.catalog.battleSizeById.get(roster.battleSizeId);
  const detachmentIds = roster.detachmentIds || [];
  const detachments = detachmentIds
    .map((id) => state.catalog.detachmentById.get(id))
    .filter(Boolean);
  const detachmentPoints = detachmentIds.reduce((total, id) => (
    total + costForDetachment(id, roster.factionKeywordId)
  ), 0);
  const units = rosterUnitSummaries(roster);
  const totalPoints = units.reduce((total, unit) => total + (unit.points || 0), 0);
  return {
    detachmentIds,
    detachmentLimit: size?.detachmentPointsLimit || 0,
    detachmentPoints,
    detachments,
    duplicateLimit: size?.duplicateUnitLimit || 3,
    pointsLimit: size?.pointsLimit || 0,
    size,
    totalPoints,
    units,
  };
}

function rosterValidationResult(context, messages) {
  return {
    state: messages.some((item) => item.level === "error") ? "invalid" : "valid",
    messages,
    points: {
      total: context.totalPoints,
      limit: context.pointsLimit,
      detachmentPoints: context.detachmentPoints,
      detachmentLimit: context.detachmentLimit,
      detachments: context.detachments,
    },
  };
}

export {
  rosterValidationContext,
  rosterValidationResult,
};
