import {
  datasheetFactionIds,
  factionDescendantIds,
  factionScope,
} from "./builder_model_core.js";
import {
  datasheetDetachmentExcluded,
  datasheetExcluded,
  factionExcludesDatasheet,
} from "./builder_datasheet_exclusions.js";

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

export {
  datasheetDetachmentExcluded,
  datasheetExcluded,
  datasheetIsNativeToFaction,
  factionExcludesDatasheet,
};
