const EXPORT_KIND = "heretic-builder-rosters";
const EXPORT_VERSION = 1;

function cloneRoster(roster) {
  return JSON.parse(JSON.stringify(roster));
}

function exportRostersPayload(rosters, dataVersion) {
  return {
    kind: EXPORT_KIND,
    version: EXPORT_VERSION,
    dataVersion: dataVersion || null,
    exportedAt: new Date().toISOString(),
    rosters: (rosters || []).map(cloneRoster),
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
  return payload.rosters.map((roster) => {
    if (!roster || typeof roster !== "object" || !roster.id || !roster.factionKeywordId || !roster.battleSizeId) {
      throw new Error("Roster export file contains an invalid roster");
    }
    return {
      ...cloneRoster(roster),
      detachmentIds: Array.isArray(roster.detachmentIds) ? [...roster.detachmentIds] : [],
      units: Array.isArray(roster.units) ? cloneRoster(roster.units) : [],
      attachments: Array.isArray(roster.attachments) ? cloneRoster(roster.attachments) : [],
    };
  });
}

export { exportRostersPayload, parseImportedRosters, serializeRosters };
