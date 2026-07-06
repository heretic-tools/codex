import { loadPrecomputedLoadoutShards } from "./builder_catalog_loader.js";
import { precomputedLoadoutsByContext } from "./builder_catalog_special_indexes.js";
import { state } from "./builder_state.js";

function uniqueDatasheetIds(datasheetIds) {
  return [...new Set((datasheetIds || []).filter(Boolean))];
}

function precomputedRuntimeState() {
  if (!state.catalog.precomputedLoadoutsByContext) {
    state.catalog.precomputedLoadoutsByContext = new Map();
  }
  if (!state.catalog.precomputedLoadoutShardIds) {
    state.catalog.precomputedLoadoutShardIds = new Set();
  }
  if (!state.catalog.precomputedLoadoutShardPromises) {
    state.catalog.precomputedLoadoutShardPromises = new Map();
  }
  return {
    loaded: state.catalog.precomputedLoadoutShardIds,
    map: state.catalog.precomputedLoadoutsByContext,
    promises: state.catalog.precomputedLoadoutShardPromises,
  };
}

function mergePrecomputedShard(map, shard) {
  for (const [key, record] of precomputedLoadoutsByContext(shard?.contexts || [])) {
    map.set(key, record);
  }
}

async function ensurePrecomputedLoadoutsForDatasheets(datasheetIds) {
  const ids = uniqueDatasheetIds(datasheetIds);
  if (!ids.length) {
    return;
  }
  const runtime = precomputedRuntimeState();
  const pendingIds = ids.filter((id) => !runtime.loaded.has(id) && !runtime.promises.has(id));
  const waits = ids
    .map((id) => runtime.promises.get(id))
    .filter(Boolean);
  if (pendingIds.length) {
    const promise = loadPrecomputedLoadoutShards(pendingIds)
      .then((shards) => {
        for (const shard of shards) {
          mergePrecomputedShard(runtime.map, shard);
        }
        for (const id of pendingIds) {
          runtime.loaded.add(id);
        }
      })
      .finally(() => {
        for (const id of pendingIds) {
          runtime.promises.delete(id);
        }
      });
    for (const id of pendingIds) {
      runtime.promises.set(id, promise);
    }
    waits.push(promise);
  }
  await Promise.all(waits);
}

function rosterDatasheetIds(roster) {
  return (roster?.units || []).map((unit) => unit.datasheetId);
}

export {
  ensurePrecomputedLoadoutsForDatasheets,
  rosterDatasheetIds,
};
