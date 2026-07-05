import {
  canBeWarlord,
  detachmentMandatoryWarlordRows,
  mandatoryWarlordForRoster,
} from "./builder_warlord_eligibility.js";

function warlordCandidateStatus(roster, detachments, units, unit, miniature) {
  const detachmentIds = detachments.map((item) => item.id);
  const { faction, mandatoryWarlordId, mandatoryWarlord } = mandatoryWarlordForRoster(roster);
  if (mandatoryWarlordId && miniature.miniatureId !== mandatoryWarlordId) {
    return {
      eligible: false,
      reason: `${faction.name || "Faction"} requires ${mandatoryWarlord?.name || "required model"}`,
    };
  }
  const supremeCommanders = units.flatMap((candidate) => (
    (candidate.miniatures || []).filter((item) => item.isSupremeCommander && item.count > 0)
  ));
  if (supremeCommanders.length && !supremeCommanders.some((item) => item.miniatureId === miniature.miniatureId)) {
    return { eligible: false, reason: "Supreme Commander required" };
  }
  const mandatoryRows = detachmentMandatoryWarlordRows(detachments);
  if (mandatoryRows.length && !mandatoryRows.some((row) => row.miniatureId === miniature.miniatureId)) {
    return { eligible: false, reason: `${mandatoryRows[0].detachmentName} requires another Warlord` };
  }
  if (!canBeWarlord(miniature, unit, roster, detachmentIds, [miniature.miniatureId])) {
    return { eligible: false, reason: "not eligible" };
  }
  return { eligible: true, reason: "" };
}

export { warlordCandidateStatus };
