import { canonicalWargearKey, choiceItems, cleanCounts } from "./builder_loadout_math.js";
import { state } from "./builder_state.js";
export { effectiveWargearLimit } from "./builder_wargear_limited_limits.js";

function limitedChoiceItems(choiceId, context) {
  return choiceItems(state.catalog.limitedWargearChoiceItemsByChoiceId.get(choiceId), context);
}

function filterCountsByKeys(counts, keys) {
  return cleanCounts(Object.fromEntries(
    Object.entries(counts || {}).filter(([key]) => keys.has(key))
  ));
}

function limitedUpgradeKeys(limitedSet) {
  const keys = new Set();
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(limitedSet.datasheetId) || []) {
    if (limitedSet.miniatureId && group.miniatureId !== limitedSet.miniatureId) {
      continue;
    }
    for (const option of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      if (Number(option.defaultValue || 0) > 0) {
        continue;
      }
      keys.add(canonicalWargearKey(option.wargearItemId, {
        datasheetId: group.datasheetId,
        miniatureId: group.miniatureId,
      }));
    }
  }
  return keys;
}

function limitedWargearChoices(limitedSet, upgradeKeys) {
  const defaultAllowedKeys = new Set();
  const choices = [];
  for (const row of state.catalog.limitedWargearChoicesBySetId.get(limitedSet.id) || []) {
    const raw = limitedChoiceItems(row.id, {
      datasheetId: limitedSet.datasheetId,
      miniatureId: limitedSet.miniatureId,
    });
    const upgradeOnly = filterCountsByKeys(raw, upgradeKeys);
    const choice = Object.keys(upgradeOnly).length ? upgradeOnly : raw;
    if (!Object.keys(upgradeOnly).length) {
      for (const key of Object.keys(raw)) {
        defaultAllowedKeys.add(key);
      }
    }
    if (Object.keys(choice).length) {
      choices.push(choice);
    }
  }
  return { choices, defaultAllowedKeys };
}

export {
  filterCountsByKeys,
  limitedUpgradeKeys,
  limitedWargearChoices,
};
