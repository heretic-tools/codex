import { state } from "./builder_state.js";
import {
  addWargearCount,
  closestValidDefaultLoadout,
  defaultWargearOptionsByKey,
} from "./builder_model_wargear_default_loadouts.js";

function baseMiniatureLoadout(datasheetId, miniatureId) {
  const exact = (state.catalog.baseMiniatureLoadoutsByMiniatureId.get(miniatureId) || [])
    .find((row) => row.datasheetId === datasheetId);
  if (exact) {
    return exact;
  }
  return (state.catalog.baseMiniatureLoadoutsByDatasheetId.get(datasheetId) || [])
    .find((row) => !row.miniatureId) || null;
}

function defaultMiniatureWargear(datasheetId, miniatureId, modelCount) {
  if ((modelCount || 0) <= 0) {
    return {};
  }
  const result = {};
  const loadout = baseMiniatureLoadout(datasheetId, miniatureId);
  if (loadout) {
    for (const item of state.catalog.baseMiniatureLoadoutWargearOptionsByLoadoutId.get(loadout.id) || []) {
      const optionRow = state.catalog.wargearOptionById.get(item.wargearOptionId);
      const group = optionRow ? state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId) : null;
      if (group?.datasheetId === datasheetId && group?.miniatureId === miniatureId) {
        addWargearCount(result, item.wargearOptionId, (item.count || 0) * (modelCount || 0));
      }
    }
  }
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(datasheetId) || []) {
    if (group.miniatureId !== miniatureId) {
      continue;
    }
    for (const item of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      if (!(item.id in result)) {
        addWargearCount(result, item.id, item.defaultValue);
      }
    }
  }
  const optionByKey = defaultWargearOptionsByKey(datasheetId, miniatureId);
  return closestValidDefaultLoadout(datasheetId, miniatureId, result, modelCount || 0, optionByKey) || result;
}

export { defaultMiniatureWargear };
