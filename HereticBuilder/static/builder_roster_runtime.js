import {
  currentDataVersion,
  lightweightRosterSummary,
  rosterListCacheIsFreshForCurrentData,
  rosterWithFreshListCache,
} from "./builder_roster_runtime_summary.js";
import { state } from "./builder_state.js";
import { getAllRosters, saveRoster } from "./builder_storage.js";

function currentRoster() {
  return state.rosters.find((roster) => roster.id === state.route.rosterId) || null;
}

function routeRoster(route) {
  return state.rosters.find((roster) => roster.id === route.rosterId) || null;
}

async function refreshRosters() {
  state.rosters = (await getAllRosters()).sort((left, right) => (
    String(right.modifiedAt || "").localeCompare(String(left.modifiedAt || ""))
    || String(left.name || "").localeCompare(String(right.name || ""))
  ));
}

async function saveRosterCacheIfStale(roster, validation) {
  if (rosterListCacheIsFreshForCurrentData(roster)) {
    return;
  }
  await saveRoster(rosterWithFreshListCache(roster, validation), { touch: false });
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
