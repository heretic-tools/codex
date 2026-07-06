import { choiceItems } from "./builder_loadout_math.js";
import { state } from "./builder_state.js";
import { filterCountsByKeys } from "./builder_wargear_limited_count_filters.js";
export { effectiveWargearLimit } from "./builder_wargear_limited_limits.js";
export { limitedUpgradeKeys } from "./builder_wargear_limited_upgrade_keys.js";

function limitedChoiceItems(choiceId, context) {
  return choiceItems(state.catalog.limitedWargearChoiceItemsByChoiceId.get(choiceId), context);
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
  limitedWargearChoices,
};
