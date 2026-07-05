import { cleanCounts } from "./builder_loadout_counts.js";
import { canonicalWargearKey } from "./builder_loadout_keys.js";
import { state } from "./builder_state.js";

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

export { choiceItems, loadoutChoiceItems };
