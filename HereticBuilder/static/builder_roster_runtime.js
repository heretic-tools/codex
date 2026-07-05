import {
  rosterCachedPointsTotal,
  rosterListCacheIsFresh,
  rosterWithListCache,
} from "./builder_roster_cache.js";
import { state } from "./builder_state.js";
import { getAllRosters, saveRoster } from "./builder_storage.js";

function currentDataVersion() {
  return state.catalog?.bootstrap?.dataVersion || null;
}

function currentRoster() {
  return state.rosters.find((roster) => roster.id === state.route.rosterId) || null;
}

function routeRoster(route) {
  return state.rosters.find((roster) => roster.id === route.rosterId) || null;
}

function bootstrapRowById(rows, id) {
  return (rows || []).find((row) => row.id === id) || null;
}

function lightweightRosterSummary(roster) {
  const faction = bootstrapRowById(state.catalog.factions, roster.factionKeywordId);
  const battleSize = bootstrapRowById(state.catalog.battleSizes, roster.battleSizeId);
  const cacheFresh = rosterListCacheIsFresh(roster, currentDataVersion());
  return {
    battleSizeName: battleSize?.name || "Unknown Battle Size",
    detachmentCount: (roster.detachmentIds || []).length,
    factionName: faction?.name || "Unknown Faction",
    pointsLimit: battleSize?.pointsLimit || 0,
    pointsTotal: rosterCachedPointsTotal(roster),
    validationState: cacheFresh ? roster.listSummary.validationState : "outdated",
    unitCount: (roster.units || []).length,
  };
}

async function refreshRosters() {
  state.rosters = (await getAllRosters()).sort((left, right) => (
    String(right.modifiedAt || "").localeCompare(String(left.modifiedAt || ""))
    || String(left.name || "").localeCompare(String(right.name || ""))
  ));
}

function rosterWithFreshListCache(roster, validation) {
  return rosterWithListCache(roster, validation, currentDataVersion());
}

async function saveRosterCacheIfStale(roster, validation) {
  const dataVersion = currentDataVersion();
  if (rosterListCacheIsFresh(roster, dataVersion)) {
    return;
  }
  await saveRoster(rosterWithListCache(roster, validation, dataVersion), { touch: false });
  await refreshRosters();
}

export {
  currentDataVersion,
  currentRoster,
  lightweightRosterSummary,
  refreshRosters,
  rosterWithFreshListCache,
  routeRoster,
  saveRosterCacheIfStale,
};
