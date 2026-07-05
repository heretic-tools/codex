import {
  LEGACY_MINIATURE_FIELDS,
  normalizedWargearMap,
  numberOrNull,
  requireNoLegacyFields,
} from "./builder_roster_transfer_normalize_helpers.js";

function normalizedMiniatures(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => {
    requireNoLegacyFields(row, LEGACY_MINIATURE_FIELDS, "Roster miniature");
    if (!row || typeof row !== "object" || typeof row.miniatureId !== "string" || !row.miniatureId) {
      throw new Error("Roster export file contains an invalid miniature row");
    }
    const result = {
      miniatureId: row.miniatureId,
      wargear: normalizedWargearMap(row.wargear),
    };
    for (const fieldName of ["id", "rosterUnitMiniatureId"]) {
      if (typeof row[fieldName] === "string" && row[fieldName]) {
        result[fieldName] = row[fieldName];
      }
    }
    for (const fieldName of ["count", "min", "max"]) {
      const value = numberOrNull(row[fieldName]);
      if (value != null) {
        result[fieldName] = value;
      }
    }
    if (row.isWarlord) {
      result.isWarlord = true;
    }
    return result;
  });
}

export { normalizedMiniatures };
