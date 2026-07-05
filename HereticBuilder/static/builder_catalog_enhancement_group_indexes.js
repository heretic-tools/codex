import { groupBy } from "./builder_catalog_index_helpers.js";

function buildEnhancementGroupIndexes(tables) {
  const {
    factionKeywordMandatoryAllegianceAbilities,
    allegianceAbilities,
    enhancementKeywordPointsCosts,
    enhancementExcludedKeywords,
    enhancementRequiredWargearItems,
    enhancementRequiredKeywordGroups,
    enhancementRequiredKeywordGroupKeywords,
    enhancementRequiredKeywordGroupFactionKeywords,
    enhancementBodyguardGroups,
    enhancementBodyguardGroupDatasheets,
    enhancementBodyguardGroupKeywords,
  } = tables;

  return {
    mandatoryAllegianceAbilitiesByFactionId: groupBy(factionKeywordMandatoryAllegianceAbilities, "factionKeywordId"),
    allegianceAbilitiesByGroupId: groupBy(allegianceAbilities, "allegianceAbilityGroupId"),
    enhancementKeywordPointsCostsByEnhancementId: groupBy(enhancementKeywordPointsCosts, "enhancementId"),
    enhancementExcludedKeywordsByEnhancementId: groupBy(enhancementExcludedKeywords, "enhancementId"),
    enhancementRequiredWargearItemsByEnhancementId: groupBy(enhancementRequiredWargearItems, "enhancementId"),
    enhancementRequiredKeywordGroupsByEnhancementId: groupBy(enhancementRequiredKeywordGroups, "enhancementId"),
    enhancementRequiredKeywordGroupKeywordsByGroupId: groupBy(enhancementRequiredKeywordGroupKeywords, "enhancementRequiredKeywordGroupId"),
    enhancementRequiredKeywordGroupFactionsByGroupId: groupBy(enhancementRequiredKeywordGroupFactionKeywords, "enhancementRequiredKeywordGroupId"),
    enhancementBodyguardGroupsByEnhancementId: groupBy(enhancementBodyguardGroups, "enhancementId"),
    enhancementBodyguardGroupDatasheetsByGroupId: groupBy(enhancementBodyguardGroupDatasheets, "enhancementBodyguardGroupId"),
    enhancementBodyguardGroupKeywordsByGroupId: groupBy(enhancementBodyguardGroupKeywords, "enhancementBodyguardGroupId"),
  };
}

export { buildEnhancementGroupIndexes };
