const EXPORT_KIND = "heretic-builder-rosters";
const EXPORT_VERSION = 1;
const LEGACY_ROSTER_FIELDS = ["attachedUnits"];
const LEGACY_UNIT_FIELDS = ["allegianceAbilityIds", "enhancementIds", "unitWargear"];
const LEGACY_MINIATURE_FIELDS = ["enhancementIds"];

function exportRostersPayload(rosters, dataVersion) {
  return {
    kind: EXPORT_KIND,
    version: EXPORT_VERSION,
    dataVersion: dataVersion || null,
    exportedAt: new Date().toISOString(),
    rosters: (rosters || []).map(normalizedRoster),
  };
}

function serializeRosters(rosters, dataVersion) {
  return JSON.stringify(exportRostersPayload(rosters, dataVersion), null, 2);
}

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

function normalizedAttachments(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || !Array.isArray(row.members)) {
      throw new Error("Roster export file contains an invalid attached unit");
    }
    return {
      id: row.id,
      members: row.members.map((member) => {
        if (
          !member
          || typeof member !== "object"
          || typeof member.rosterUnitId !== "string"
          || !member.rosterUnitId
          || !["bodyguard", "leader", "support"].includes(member.attachmentType)
        ) {
          throw new Error("Roster export file contains an invalid attached unit member");
        }
        return {
          rosterUnitId: member.rosterUnitId,
          attachmentType: member.attachmentType,
        };
      }),
    };
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

function parseImportedRosters(source) {
  const payload = JSON.parse(source);
  if (!payload || payload.kind !== EXPORT_KIND || payload.version !== EXPORT_VERSION || !Array.isArray(payload.rosters)) {
    throw new Error("Unsupported roster export file");
  }
  return payload.rosters.map(normalizedRoster);
}

function rostersWithNonConflictingIds(rosters, existingIds, newId) {
  const used = new Set(existingIds || []);
  return (rosters || []).map((roster) => {
    let id = roster.id;
    while (used.has(id)) {
      id = newId();
    }
    used.add(id);
    return id === roster.id ? roster : { ...roster, id };
  });
}

export {
  exportRostersPayload,
  parseImportedRosters,
  rostersWithNonConflictingIds,
  serializeRosters,
};
