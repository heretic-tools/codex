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

function cachedPrecomputedCounts(contextKey, fingerprints) {
  const cache = catalogPrecomputedLoadoutCache();
  if (!cache.has(contextKey)) {
    cache.set(contextKey, fingerprints.map((fingerprint) => countsFromKey(fingerprint)));
  }
  return cache.get(contextKey);
}

export {
  cachedPrecomputedCounts,
  normalizedPrecomputedRecord,
  sameOrderedIds,
};
