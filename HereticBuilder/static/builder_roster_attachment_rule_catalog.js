import { idsFromRows } from "./builder_model.js";
import { state } from "./builder_state.js";

function nameForId(mapName, id, fallback) {
  return state.catalog?.[mapName]?.get(id)?.name || fallback;
}

function bodyguardDatasheetIdsForRule(row) {
  return new Set(idsFromRows(
    state.catalog.datasheetBodyguardGroupDatasheetsByGroupId.get(row.id),
    "datasheetId"
  ));
}

function bodyguardKeywordIdsForRule(row) {
  return new Set(idsFromRows(
    state.catalog.datasheetBodyguardGroupKeywordsByGroupId.get(row.id),
    "keywordId"
  ));
}

export {
  bodyguardDatasheetIdsForRule,
  bodyguardKeywordIdsForRule,
  nameForId,
};
