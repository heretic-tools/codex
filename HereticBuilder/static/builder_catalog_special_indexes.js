function contextKey(datasheetId, miniatureId = null) {
  return `${datasheetId || ""}:${miniatureId || ""}`;
}

function wargearAliasesByContext(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const key = contextKey(row.datasheetId, row.miniatureId);
    if (!map.has(key)) {
      map.set(key, new Map());
    }
    map.get(key).set(row.wargearItemId, row.key);
  }
  return map;
}

function precomputedLoadoutsByContext(rows) {
  const map = new Map();
  for (const row of rows || []) {
    map.set(contextKey(row.datasheetId, row.miniatureId), {
      fingerprints: row.fingerprints || [],
      loadoutChoiceSetIds: row.loadoutChoiceSetIds || [],
    });
  }
  return map;
}

function unitImagesByDatasheetId(datasheets) {
  return new Map((datasheets || [])
    .filter((row) => row.unitImageFilename)
    .map((row) => [row.id, row.unitImageFilename]));
}

export {
  precomputedLoadoutsByContext,
  unitImagesByDatasheetId,
  wargearAliasesByContext,
};
