import {
  rosterCachedPointsTotal,
  rosterListCacheIsFresh,
  rosterWithListCache,
} from "./builder_roster_cache.js";
import { state } from "./builder_state.js";

function currentDataVersion() {
  return state.catalog?.bootstrap?.dataVersion || null;
}

function bootstrapRowById(rows, id) {
  return (rows || []).find((row) => row.id === id) || null;
}

function rosterListCacheIsFreshForCurrentData(roster) {
  return rosterListCacheIsFresh(roster, currentDataVersion());
}

function rosterDetachmentBadges(roster) {
  const byId = state.catalog.detachmentSummaryById || new Map();
  return (roster.detachmentIds || [])
    .map((detachmentId) => byId.get(detachmentId))
    .filter(Boolean);
}

function lightweightRosterSummary(roster) {
  const faction = bootstrapRowById(state.catalog.factions, roster.factionKeywordId);
  const battleSize = bootstrapRowById(state.catalog.battleSizes, roster.battleSizeId);
  const cacheFresh = rosterListCacheIsFreshForCurrentData(roster);
  return {
    battleSizeName: battleSize?.name || "Unknown Battle Size",
    detachmentBadges: rosterDetachmentBadges(roster),
    detachmentCount: (roster.detachmentIds || []).length,
    factionImageFilename: faction?.factionImageFilename || "",
    factionName: faction?.name || "Unknown Faction",
    pointsLimit: battleSize?.pointsLimit || 0,
    pointsTotal: rosterCachedPointsTotal(roster),
    validationState: cacheFresh ? roster.listSummary.validationState : "outdated",
    unitCount: (roster.units || []).length,
  };
}

function rosterWithFreshListCache(roster, validation) {
  return rosterWithListCache(roster, validation, currentDataVersion());
}

export {
  currentDataVersion,
  lightweightRosterSummary,
  rosterListCacheIsFreshForCurrentData,
  rosterWithFreshListCache,
};
