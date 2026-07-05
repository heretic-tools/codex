import {
  LEGACY_UNIT_FIELDS,
  normalizedSelectionRows,
  normalizedWargearMap,
  requireNoLegacyFields,
} from "./builder_roster_transfer_normalize_helpers.js";
import { normalizedMiniatures } from "./builder_roster_transfer_normalize_miniatures.js";

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
