import { factionScope } from "./builder_model_core.js";
import { state } from "./builder_state.js";

function factionExcludesDatasheet(factionKeywordId, datasheetId) {
  const scope = new Set(factionScope(factionKeywordId));
  return state.catalog.factionExcludedDatasheets.some((row) => (
    row.datasheetId === datasheetId && scope.has(row.factionKeywordId)
  ));
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
  factionExcludesDatasheet,
};
