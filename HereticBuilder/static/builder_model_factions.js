import { state } from "./builder_state.js";
import { idsFromRows } from "./builder_model_utils.js";

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

function datasheetFactionIds(datasheetId) {
  return idsFromRows(state.catalog.datasheetFactionKeywordsByDatasheetId.get(datasheetId), "factionKeywordId");
}

function miniatureKeywordIds(miniatureId) {
  return idsFromRows(state.catalog.miniatureKeywordsByMiniatureId.get(miniatureId), "keywordId");
}

export {
  datasheetFactionIds,
  factionDescendantIds,
  factionScope,
  miniatureKeywordIds,
};
