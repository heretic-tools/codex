import {
  cleanCounts,
  wargearOptionKey,
} from "./builder_loadout_math.js";
import { state } from "./builder_state.js";

function optionItemCounts(optionCounts) {
  const result = {};
  for (const [optionId, count] of Object.entries(optionCounts || {})) {
    const optionRow = state.catalog.wargearOptionById.get(optionId);
    const key = wargearOptionKey(optionRow);
    if (key) {
      result[key] = (result[key] || 0) + Number(count || 0);
    }
  }
  return cleanCounts(result);
}

export { optionItemCounts };
