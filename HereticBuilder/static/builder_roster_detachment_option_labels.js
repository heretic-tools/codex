import {
  costForDetachment,
  detachmentDispositionName,
} from "./builder_model.js";

function detachmentOptionLabel(roster, detachment) {
  const disposition = detachmentDispositionName(detachment) || "No disposition";
  return `${detachment.name} (${disposition} / ${costForDetachment(detachment.id, roster.factionKeywordId)} DP)`;
}

function detachmentOptionText(roster, detachment, status) {
  const label = detachmentOptionLabel(roster, detachment);
  return status.reason ? `${label} / ${status.reason}` : label;
}

export { detachmentOptionText };
