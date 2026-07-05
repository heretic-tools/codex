import { state } from "./builder_state.js";

function contextKey(datasheetId, miniatureId = null) {
  return `${datasheetId || ""}:${miniatureId || ""}`;
}

function canonicalWargearKey(wargearItemId, context = {}) {
  if (!wargearItemId) {
    return "";
  }
  const aliases = state.catalog.wargearAliasesByContext || new Map();
  const exact = aliases.get(contextKey(context.datasheetId, context.miniatureId))?.get(wargearItemId);
  if (exact) {
    return exact;
  }
  const datasheetWide = aliases.get(contextKey(context.datasheetId, null))?.get(wargearItemId);
  if (datasheetWide) {
    return datasheetWide;
  }
  return `id:${wargearItemId}`;
}

function wargearOptionKey(optionRow) {
  const group = optionRow ? state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId) : null;
  return canonicalWargearKey(optionRow?.wargearItemId, {
    datasheetId: group?.datasheetId,
    miniatureId: group?.miniatureId,
  });
}

export { canonicalWargearKey, contextKey, wargearOptionKey };
