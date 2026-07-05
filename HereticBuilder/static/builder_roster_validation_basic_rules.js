import { detachmentAllowed } from "./builder_model.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";

function validateRosterSelectionLimits(roster, context, messages) {
  const {
    detachmentIds,
    detachmentLimit,
    detachmentPoints,
    pointsLimit,
    totalPoints,
  } = context;

  if (!detachmentIds.length) {
    messages.push(validationMessage("roster.detachment_not_selected", "Pick a detachment."));
  }
  for (const detachmentId of detachmentIds) {
    const detachment = state.catalog.detachmentById.get(detachmentId);
    if (!detachmentAllowed(detachmentId, roster.factionKeywordId)) {
      messages.push(validationMessage(
        "roster.detachment_not_allowed",
        `${detachment?.name || "Detachment"} is not available to this faction.`,
        "error",
        { detachmentId }
      ));
    }
  }
  if (detachmentLimit && detachmentPoints > detachmentLimit) {
    messages.push(validationMessage(
      "roster.detachment_points_limit_exceeded",
      `Roster uses ${detachmentPoints} detachment points; limit is ${detachmentLimit}.`,
      "error",
      { detachmentIds }
    ));
  }
  if (pointsLimit && totalPoints > pointsLimit) {
    messages.push(validationMessage("roster.points_limit_exceeded", `Roster is ${totalPoints - pointsLimit} points over the ${pointsLimit} point limit.`));
  }
}

export { validateRosterSelectionLimits };
