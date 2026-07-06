import { cleanCounts } from "./builder_loadout_math.js";

function filterCountsByKeys(counts, keys) {
  return cleanCounts(Object.fromEntries(
    Object.entries(counts || {}).filter(([key]) => keys.has(key))
  ));
}

export { filterCountsByKeys };
