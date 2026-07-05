import { state } from "./builder_state.js";

function factionScope(factionKeywordId) {
  const scope = [];
  const seen = new Set();
  let current = factionKeywordId;
  while (current && !seen.has(current)) {
    seen.add(current);
    scope.push(current);
    current = state.catalog.factionKeywordById.get(current)?.parentFactionKeywordId || "";
  }
  return scope;
}

function factionDescendantIds(factionKeywordId) {
  const result = [];
  const pending = [factionKeywordId];
  const seen = new Set(pending);
  while (pending.length) {
    const parentId = pending.shift();
    for (const faction of state.catalog.factionKeywords) {
      if (faction.parentFactionKeywordId !== parentId || seen.has(faction.id)) {
        continue;
      }
      seen.add(faction.id);
      result.push(faction.id);
      pending.push(faction.id);
    }
  }
  return result;
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function lowerName(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function idsFromRows(rows, key) {
  return (rows || []).map((row) => row[key]).filter(Boolean);
}

function datasheetFactionIds(datasheetId) {
  return idsFromRows(state.catalog.datasheetFactionKeywordsByDatasheetId.get(datasheetId), "factionKeywordId");
}

function setIntersects(left, right) {
  for (const value of left) {
    if (right.has(value)) {
      return true;
    }
  }
  return false;
}

function namesForIds(map, ids, fallback = "item") {
  return (ids || []).map((id) => map.get(id)?.name || fallback);
}

function miniatureKeywordIds(miniatureId) {
  return idsFromRows(state.catalog.miniatureKeywordsByMiniatureId.get(miniatureId), "keywordId");
}

export {
  datasheetFactionIds,
  factionDescendantIds,
  factionScope,
  idsFromRows,
  lowerName,
  miniatureKeywordIds,
  namesForIds,
  setIntersects,
  unique,
};
