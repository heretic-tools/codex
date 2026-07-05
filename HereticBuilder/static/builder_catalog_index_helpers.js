function byId(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!map.has(value)) {
      map.set(value, []);
    }
    map.get(value).push(row);
  }
  return map;
}

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

function unitImagesByDatasheetId(payload) {
  return new Map(Object.entries(payload?.imagesByDatasheetId || {}));
}

export {
  byId,
  groupBy,
  precomputedLoadoutsByContext,
  unitImagesByDatasheetId,
  wargearAliasesByContext,
};
