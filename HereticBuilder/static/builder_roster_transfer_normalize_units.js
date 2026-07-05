import {
  LEGACY_MINIATURE_FIELDS,
  LEGACY_UNIT_FIELDS,
  normalizedSelectionRows,
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

function normalizedUnits(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => {
    requireNoLegacyFields(row, LEGACY_UNIT_FIELDS, "Roster unit");
    if (
      !row
      || typeof row !== "object"
      || typeof row.id !== "string"
      || !row.id
      || typeof row.datasheetId !== "string"
      || !row.datasheetId
      || typeof row.compositionId !== "string"
      || !row.compositionId
    ) {
      throw new Error("Roster export file contains an invalid unit");
    }
    return {
      id: row.id,
      allyType: typeof row.allyType === "string" && row.allyType ? row.allyType : "native",
      datasheetId: row.datasheetId,
      compositionId: row.compositionId,
      wargear: normalizedWargearMap(row.wargear),
      unitEnhancements: normalizedSelectionRows(row.unitEnhancements),
      miniatureEnhancements: normalizedSelectionRows(row.miniatureEnhancements, { requireTarget: true }),
      allegianceAbilities: normalizedSelectionRows(row.allegianceAbilities),
      miniatures: normalizedMiniatures(row.miniatures),
    };
  });
}

export { normalizedUnits };
