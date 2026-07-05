import { numberOrNull } from "./builder_roster_transfer_values.js";

function normalizedListSummary(summary) {
  if (!summary || typeof summary !== "object") {
    return null;
  }
  const detachmentPoints = numberOrNull(summary.detachmentPoints);
  const pointsTotal = numberOrNull(summary.pointsTotal);
  if (detachmentPoints == null || pointsTotal == null || typeof summary.validationState !== "string") {
    return null;
  }
  return {
    detachmentPoints,
    pointsTotal,
    validationState: summary.validationState,
  };
}

export { normalizedListSummary };
