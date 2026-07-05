import {
  datasheetFactionIds,
  factionDescendantIds,
  factionScope,
} from "./builder_model_core.js";
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

function datasheetDetachmentExcluded(roster, datasheetId) {
  return (roster.detachmentIds || []).some((detachmentId) => (
    state.catalog.detachmentExcludedDatasheets.some((row) => (
      row.detachmentId === detachmentId && row.datasheetId === datasheetId
    ))
  ));
}

function datasheetExcluded(roster, datasheetId) {
  if (factionExcludesDatasheet(roster.factionKeywordId, datasheetId)) {
    return true;
  }
  return datasheetDetachmentExcluded(roster, datasheetId);
}

export {
  datasheetDetachmentExcluded,
  datasheetExcluded,
  datasheetIsNativeToFaction,
  factionExcludesDatasheet,
};
