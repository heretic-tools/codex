const LEGACY_ROSTER_FIELDS = ["attachedUnits"];
const LEGACY_UNIT_FIELDS = ["allegianceAbilityIds", "enhancementIds", "unitWargear"];
const LEGACY_MINIATURE_FIELDS = ["enhancementIds"];

function requireNoLegacyFields(row, fieldNames, label) {
  const found = fieldNames.filter((fieldName) => Object.hasOwn(row || {}, fieldName));
  if (found.length) {
    throw new Error(`${label} uses legacy roster fields: ${found.join(", ")}`);
  }
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringArray(values) {
  return Array.isArray(values) ? values.filter((value) => typeof value === "string" && value) : [];
}

function normalizedWargearMap(wargear) {
  const result = {};
  if (!wargear || typeof wargear !== "object" || Array.isArray(wargear)) {
    return result;
  }
  for (const [optionId, count] of Object.entries(wargear)) {
    const value = numberOrNull(count);
    if (typeof optionId === "string" && optionId && value > 0) {
      result[optionId] = value;
    }
  }
  return result;
}

function normalizedSelectionRows(rows, { requireTarget = false } = {}) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id) {
      throw new Error("Roster export file contains an invalid selection row");
    }
    const result = { id: row.id };
    if (requireTarget) {
      if (typeof row.targetId !== "string" || !row.targetId) {
        throw new Error("Roster export file contains an invalid targeted selection row");
      }
      result.targetId = row.targetId;
    }
    return result;
  });
}

function normalizedListSummary(summary) {
  if (!summary || typeof summary !== "object") {
    return null;
  }
  const detachmentPoints = numberOrNull(summary.detachmentPoints);
  const pointsTotal = numberOrNull(summary.pointsTotal);
  if (detachmentPoints == null || pointsTotal == null || typeof summary.validationState !== "string") {
    return null;
  }
  return {
    detachmentPoints,
    pointsTotal,
    validationState: summary.validationState,
  };
}

export {
  LEGACY_MINIATURE_FIELDS,
  LEGACY_ROSTER_FIELDS,
  LEGACY_UNIT_FIELDS,
  normalizedListSummary,
  normalizedSelectionRows,
  normalizedWargearMap,
  numberOrNull,
  requireNoLegacyFields,
  stringArray,
};
