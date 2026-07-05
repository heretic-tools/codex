import {
  datasheetFactionIds,
  factionDescendantIds,
  factionScope,
  idsFromRows,
} from "./builder_model_core.js";
import { compositionFactionIds } from "./builder_model_selections.js";
import { defaultComposition } from "./builder_model_compositions.js";
import { alliedFactionAllowed } from "./builder_allied_unit_sources.js";
import { state } from "./builder_state.js";

function factionExcludesDatasheet(factionKeywordId, datasheetId) {
  const scope = new Set(factionScope(factionKeywordId));
  return state.catalog.factionExcludedDatasheets.some((row) => (
    row.datasheetId === datasheetId && scope.has(row.factionKeywordId)
  ));
}

function datasheetHasDescendantFaction(factionKeywordId, datasheetId) {
  const descendants = new Set(factionDescendantIds(factionKeywordId));
  if (!descendants.size) {
    return false;
  }
  return datasheetFactionIds(datasheetId).some((id) => descendants.has(id));
}

function datasheetIsNativeToFaction(factionKeywordId, datasheetId) {
  const datasheetFactions = datasheetFactionIds(datasheetId);
  const scope = new Set(factionScope(factionKeywordId));
  if (!datasheetFactions.some((id) => scope.has(id))) {
    return false;
  }
  if (factionExcludesDatasheet(factionKeywordId, datasheetId)) {
    return false;
  }
  if (datasheetFactions.includes(factionKeywordId) && datasheetHasDescendantFaction(factionKeywordId, datasheetId)) {
    return false;
  }
  return true;
}

function datasheetExcluded(roster, datasheetId) {
  if (factionExcludesDatasheet(roster.factionKeywordId, datasheetId)) {
    return true;
  }
  return datasheetDetachmentExcluded(roster, datasheetId);
}

function datasheetDetachmentExcluded(roster, datasheetId) {
  return (roster.detachmentIds || []).some((detachmentId) => (
    state.catalog.detachmentExcludedDatasheets.some((row) => (
      row.detachmentId === detachmentId && row.datasheetId === datasheetId
    ))
  ));
}

function datasheetIsCombatPatrol(datasheet) {
  return Boolean(state.catalog.publicationById.get(datasheet?.publicationId)?.isCombatPatrol);
}

function availableDatasheets(roster, allyType = "native") {
  const factionIds = compositionFactionIds(roster, allyType);
  const allowedAlliedDatasheets = allyType === "native"
    ? null
    : new Set(idsFromRows(state.catalog.alliedFactionDatasheetsByAlliedFactionId.get(allyType), "datasheetId"));
  return state.catalog.datasheets
    .filter((datasheet) => {
      if (allyType === "native") {
        return datasheetIsNativeToFaction(roster.factionKeywordId, datasheet.id) && !datasheetExcluded(roster, datasheet.id);
      }
      return alliedFactionAllowed(roster.factionKeywordId, allyType)
        && allowedAlliedDatasheets?.has(datasheet.id)
        && !datasheetDetachmentExcluded(roster, datasheet.id);
    })
    .filter((datasheet) => !datasheetIsCombatPatrol(datasheet))
    .filter((datasheet) => defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []))
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export {
  availableDatasheets,
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  factionExcludesDatasheet,
};
