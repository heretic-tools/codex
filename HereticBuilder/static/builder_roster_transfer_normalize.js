import {
  LEGACY_ROSTER_FIELDS,
  normalizedListSummary,
  numberOrNull,
  requireNoLegacyFields,
  stringArray,
} from "./builder_roster_transfer_normalize_helpers.js";
import {
  normalizedAttachments,
  normalizedUnits,
} from "./builder_roster_transfer_normalize_units.js";

function normalizedRoster(roster) {
  requireNoLegacyFields(roster, LEGACY_ROSTER_FIELDS, "Roster");
  if (!roster || typeof roster !== "object" || !roster.id || !roster.factionKeywordId || !roster.battleSizeId) {
    throw new Error("Roster export file contains an invalid roster");
  }
  const result = {
    id: roster.id,
    name: typeof roster.name === "string" ? roster.name : "",
    factionKeywordId: roster.factionKeywordId,
    battleSizeId: roster.battleSizeId,
    detachmentIds: stringArray(roster.detachmentIds),
    units: normalizedUnits(roster.units),
    attachments: normalizedAttachments(roster.attachments),
  };
  for (const fieldName of ["createdAt", "modifiedAt"]) {
    if (typeof roster[fieldName] === "string" && roster[fieldName]) {
      result[fieldName] = roster[fieldName];
    }
  }
  const dataVersion = numberOrNull(roster.dataVersion);
  if (dataVersion != null) {
    result.dataVersion = dataVersion;
  }
  const listSummary = normalizedListSummary(roster.listSummary);
  if (listSummary) {
    result.listSummary = listSummary;
  }
  return result;
}

export { normalizedRoster };
