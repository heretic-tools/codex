import { factionScope } from "./builder_model_core.js";

function conditionalKeywordApplies(row, roster, detachmentIds, allegianceAbilityIds, warlordMiniatureIds) {
  if (row.requiredWarlordMiniatureId && !warlordMiniatureIds.has(row.requiredWarlordMiniatureId)) {
    return false;
  }
  if (row.requiredAllegianceAbilityId && !allegianceAbilityIds.has(row.requiredAllegianceAbilityId)) {
    return false;
  }
  if (row.requiredRosterFactionKeywordId && !factionScope(roster.factionKeywordId).includes(row.requiredRosterFactionKeywordId)) {
    return false;
  }
  if (row.requiredDetachmentId && !detachmentIds.has(row.requiredDetachmentId)) {
    return false;
  }
  return true;
}

export { conditionalKeywordApplies };
