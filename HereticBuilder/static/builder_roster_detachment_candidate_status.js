import { costForDetachment } from "./builder_model.js";

function detachmentCandidateStatus(roster, validation, detachment) {
  const limit = validation.points?.detachmentLimit || 0;
  if (!limit) {
    return { severity: "ok", reason: "" };
  }
  const next = (validation.points?.detachmentPoints || 0) + costForDetachment(detachment.id, roster.factionKeywordId);
  if (next > limit) {
    return { severity: "warning", reason: `${next - limit} DP over` };
  }
  return { severity: "ok", reason: "" };
}

export { detachmentCandidateStatus };
