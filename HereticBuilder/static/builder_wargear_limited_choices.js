import { canonicalWargearKey, choiceItems, cleanCounts } from "./builder_loadout_math.js";
import { state } from "./builder_state.js";

function limitedChoiceItems(choiceId, context) {
  return choiceItems(state.catalog.limitedWargearChoiceItemsByChoiceId.get(choiceId), context);
}

function filterCountsByKeys(counts, keys) {
  return cleanCounts(Object.fromEntries(
    Object.entries(counts || {}).filter(([key]) => keys.has(key))
  ));
}

function effectiveWargearLimit(limitedSetId, modelCount) {
  const rows = [...(state.catalog.wargearLimitsByLimitedSetId.get(limitedSetId) || [])]
    .sort((left, right) => (left.modelCount || 0) - (right.modelCount || 0));
  if (!rows.length) {
    return null;
  }
  const eligible = rows.filter((row) => (row.modelCount || 0) <= modelCount);
  return eligible.length ? eligible[eligible.length - 1] : { ...rows[0], choiceLimit: 0, duplicateLimit: 0 };
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
  effectiveWargearLimit,
  filterCountsByKeys,
  limitedUpgradeKeys,
  limitedWargearChoices,
};
