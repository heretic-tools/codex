import {
  availableDetachments,
  detachmentDispositionName,
} from "./builder_model.js";
import { detachmentCandidateStatus } from "./builder_roster_detachment_candidate_status.js";
export { detachmentCandidateStatus } from "./builder_roster_detachment_candidate_status.js";
export { detachmentOptionText } from "./builder_roster_detachment_option_labels.js";

function detachmentCandidateRows(roster, validation, query = "") {
  const normalizedQuery = String(query || "").trim().toLocaleLowerCase();
  return availableDetachments(roster.factionKeywordId)
    .map((detachment, index) => ({
      detachment,
      index,
      status: detachmentCandidateStatus(roster, validation, detachment),
    }))
    .filter((row) => !(roster.detachmentIds || []).includes(row.detachment.id))
    .filter((row) => (
      !normalizedQuery
      || String(row.detachment.name || "").toLocaleLowerCase().includes(normalizedQuery)
      || String(detachmentDispositionName(row.detachment) || "").toLocaleLowerCase().includes(normalizedQuery)
    ))
    .sort((left, right) => (
      Number(right.status.severity === "ok") - Number(left.status.severity === "ok")
      || left.index - right.index
    ));
}

export {
  detachmentCandidateRows,
};
