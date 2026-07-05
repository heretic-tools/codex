import {
  choiceSetsContext,
  contextKey,
  loadoutChoiceSets,
} from "./builder_loadout_catalog.js";
import {
  cachedPrecomputedCounts,
  normalizedPrecomputedRecord,
  sameOrderedIds,
} from "./builder_loadout_precomputed_cache.js";
import { state } from "./builder_state.js";

function precomputedLoadouts(datasheetId, miniatureId, loadoutChoiceSetIds) {
  const key = contextKey(datasheetId, miniatureId);
  const record = normalizedPrecomputedRecord(state.catalog.precomputedLoadoutsByContext?.get(key));
  if (!record?.fingerprints) {
    return null;
  }
  if (record.loadoutChoiceSetIds && !sameOrderedIds(record.loadoutChoiceSetIds, loadoutChoiceSetIds)) {
    return null;
  }
  return cachedPrecomputedCounts(key, record.fingerprints);
}

function precomputedLoadoutsForChoiceSets(sets) {
  const context = choiceSetsContext(sets);
  if (!context) {
    return null;
  }
  const expected = loadoutChoiceSets(context.datasheetId, context.miniatureId || null);
  if (expected.length !== sets.length) {
    return null;
  }
  for (let index = 0; index < sets.length; index += 1) {
    if (sets[index].id !== expected[index].id) {
      return null;
    }
  }
  return precomputedLoadouts(context.datasheetId, context.miniatureId, sets.map((set) => set.id));
}

export { precomputedLoadoutsForChoiceSets };
