import { cleanCounts } from "./builder_loadout_counts.js";
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

function choiceItems(rows, context = {}) {
  const counts = {};
  for (const row of rows || []) {
    const item = state.catalog.wargearItemById.get(row.wargearItemId);
    if (item) {
      const key = canonicalWargearKey(row.wargearItemId, context);
      counts[key] = (counts[key] || 0) + (row.count || 0);
    }
  }
  return cleanCounts(counts);
}

function loadoutChoiceItems(choiceId, context) {
  return choiceItems(state.catalog.loadoutChoiceItemsByChoiceId.get(choiceId), context);
}

function loadoutChoiceSets(datasheetId, miniatureId) {
  return (state.catalog.loadoutChoiceSetsByDatasheetId.get(datasheetId) || [])
    .filter((row) => (miniatureId ? row.miniatureId === miniatureId : !row.miniatureId))
    .sort((left, right) => (
      Number(Boolean(left.alternate)) - Number(Boolean(right.alternate))
      || String(left.id).localeCompare(String(right.id))
    ))
    .map((row) => ({
      ...row,
      choices: (state.catalog.loadoutChoicesBySetId.get(row.id) || []).map((choice) => loadoutChoiceItems(choice.id, {
        datasheetId: row.datasheetId,
        miniatureId: row.miniatureId,
      })),
    }));
}

function choiceSetsContext(sets) {
  if (!sets.length || !sets[0].datasheetId) {
    return null;
  }
  const datasheetId = sets[0].datasheetId || "";
  const miniatureId = sets[0].miniatureId || "";
  if (sets.some((set) => (set.datasheetId || "") !== datasheetId || (set.miniatureId || "") !== miniatureId)) {
    return null;
  }
  return { datasheetId, miniatureId };
}

export {
  canonicalWargearKey,
  choiceItems,
  choiceSetsContext,
  contextKey,
  loadoutChoiceSets,
  wargearOptionKey,
};
