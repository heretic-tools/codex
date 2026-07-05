import {
  availableDetachments,
  costForDetachment,
  detachmentDispositionName,
} from "./builder_model.js";

function detachmentOptionLabel(roster, detachment) {
  const disposition = detachmentDispositionName(detachment) || "No disposition";
  return `${detachment.name} (${disposition} / ${costForDetachment(detachment.id, roster.factionKeywordId)} DP)`;
}

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

function detachmentOptionText(roster, detachment, status) {
  const label = detachmentOptionLabel(roster, detachment);
  return status.reason ? `${label} / ${status.reason}` : label;
}

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
  detachmentCandidateStatus,
  detachmentOptionText,
};
