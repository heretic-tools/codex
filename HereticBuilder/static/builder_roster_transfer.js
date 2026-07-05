import { normalizedRoster } from "./builder_roster_transfer_normalize.js";

const EXPORT_KIND = "heretic-builder-rosters";
const EXPORT_VERSION = 1;

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
