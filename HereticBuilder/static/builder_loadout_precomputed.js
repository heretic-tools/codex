import {
  choiceSetsContext,
  contextKey,
  loadoutChoiceSets,
} from "./builder_loadout_catalog.js";
import { countsFromKey } from "./builder_loadout_counts.js";
import { state } from "./builder_state.js";

const precomputedLoadoutCacheByCatalog = new WeakMap();

function catalogPrecomputedLoadoutCache() {
  if (!state.catalog || typeof state.catalog !== "object") {
    return new Map();
  }
  if (!precomputedLoadoutCacheByCatalog.has(state.catalog)) {
    precomputedLoadoutCacheByCatalog.set(state.catalog, new Map());
  }
  return precomputedLoadoutCacheByCatalog.get(state.catalog);
}

function sameOrderedIds(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  return left.every((item, index) => item === right[index]);
}

function normalizedPrecomputedRecord(record) {
  if (Array.isArray(record)) {
    return {
      fingerprints: record,
      loadoutChoiceSetIds: null,
    };
  }
  return record || null;
}

function precomputedLoadouts(datasheetId, miniatureId, loadoutChoiceSetIds) {
  const key = contextKey(datasheetId, miniatureId);
  const record = normalizedPrecomputedRecord(state.catalog.precomputedLoadoutsByContext?.get(key));
  if (!record?.fingerprints) {
    return null;
  }
  if (record.loadoutChoiceSetIds && !sameOrderedIds(record.loadoutChoiceSetIds, loadoutChoiceSetIds)) {
    return null;
  }
  const cache = catalogPrecomputedLoadoutCache();
  if (!cache.has(key)) {
    cache.set(key, record.fingerprints.map((fingerprint) => countsFromKey(fingerprint)));
  }
  return cache.get(key);
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
