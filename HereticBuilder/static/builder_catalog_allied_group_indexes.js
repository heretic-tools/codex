import { groupBy } from "./builder_catalog_index_helpers.js";

function buildAlliedGroupIndexes(tables) {
  const {
    factionKeywordAlliedFactions,
    alliedFactionParentFactionKeywords,
    alliedFactionDatasheets,
    alliedFactionPointsLimits,
    alliedFactionKeywords,
    alliedFactionAllowedWarlordMiniatures,
    alliedFactionRequiredDetachments,
    alliedFactionAllegianceAbilities,
    alliedFactionKeywordSlotlessKeywordGroups,
    alliedFactionKeywordSlotlessDonorKeywords,
    alliedFactionKeywordSlotlessReceiverKeywords,
    keywordAllyRestrictingKeywords,
    keywordRestrictionGroups,
    keywordRestrictionGroupKeywords,
    restrictionGroupDetachmentLimits,
  } = tables;

  return {
    factionAlliedFactionsByFactionId: groupBy(factionKeywordAlliedFactions, "factionKeywordId"),
    alliedFactionParentsByAlliedFactionId: groupBy(alliedFactionParentFactionKeywords, "alliedFactionId"),
    alliedFactionDatasheetsByAlliedFactionId: groupBy(alliedFactionDatasheets, "alliedFactionId"),
    alliedFactionPointsLimitsByAlliedFactionId: groupBy(alliedFactionPointsLimits, "alliedFactionId"),
    alliedFactionKeywordsByAlliedFactionId: groupBy(alliedFactionKeywords, "alliedFactionId"),
    alliedFactionAllowedWarlordsByAlliedFactionId: groupBy(alliedFactionAllowedWarlordMiniatures, "alliedFactionId"),
    alliedFactionRequiredDetachmentsByAlliedFactionId: groupBy(alliedFactionRequiredDetachments, "alliedFactionId"),
    alliedFactionAllegianceAbilitiesByAlliedFactionId: groupBy(alliedFactionAllegianceAbilities, "alliedFactionId"),
    alliedFactionKeywordSlotlessGroupsByKeywordId: groupBy(alliedFactionKeywordSlotlessKeywordGroups, "alliedFactionKeywordId"),
    alliedFactionKeywordSlotlessDonorsByGroupId: groupBy(alliedFactionKeywordSlotlessDonorKeywords, "alliedFactionKeywordSlotlessKeywordGroupId"),
    alliedFactionKeywordSlotlessReceiversByGroupId: groupBy(alliedFactionKeywordSlotlessReceiverKeywords, "alliedFactionKeywordSlotlessKeywordGroupId"),
    keywordAllyRestrictingKeywordsByKeywordId: groupBy(keywordAllyRestrictingKeywords, "keywordId"),
    keywordRestrictionGroupsByFactionId: groupBy(keywordRestrictionGroups, "factionKeywordId"),
    keywordRestrictionGroupKeywordsByGroupId: groupBy(keywordRestrictionGroupKeywords, "keywordRestrictionGroupId"),
    restrictionGroupDetachmentLimitsByDetachmentId: groupBy(restrictionGroupDetachmentLimits, "detachmentId"),
  };
}

export { buildAlliedGroupIndexes };
