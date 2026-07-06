import { state } from "./builder_state.js";
import { wargearOptionKey } from "./builder_loadout_math.js";

function addWargearCount(result, optionId, count) {
  const value = Math.max(0, Number(count || 0));
  if (!value) {
    return;
  }
  result[optionId] = (result[optionId] || 0) + value;
}

function defaultWargearOptionsByKey(datasheetId, miniatureId) {
  const rows = [];
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(datasheetId) || []) {
    if (group.miniatureId !== miniatureId) {
      continue;
    }
    for (const option of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      const key = wargearOptionKey(option);
      if (key) {
        rows.push({ key, option });
      }
    }
  }
  rows.sort((left, right) => (
    Number((right.option.defaultValue || 0) > 0) - Number((left.option.defaultValue || 0) > 0)
    || (left.option.displayOrder || 0) - (right.option.displayOrder || 0)
  ));
  const options = new Map();
  for (const row of rows) {
    if (!options.has(row.key)) {
      options.set(row.key, row.option.id);
    }
  }
  return options;
}

export {
  addWargearCount,
  defaultWargearOptionsByKey,
};
