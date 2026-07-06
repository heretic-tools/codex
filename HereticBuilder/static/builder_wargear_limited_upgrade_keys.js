import { canonicalWargearKey } from "./builder_loadout_math.js";
import { state } from "./builder_state.js";

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

export { limitedUpgradeKeys };
