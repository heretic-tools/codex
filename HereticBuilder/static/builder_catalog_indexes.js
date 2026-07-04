function byId(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!map.has(value)) {
      map.set(value, []);
    }
    map.get(value).push(row);
  }
  return map;
}

function contextKey(datasheetId, miniatureId = null) {
  return `${datasheetId || ""}:${miniatureId || ""}`;
}

function wargearAliasesByContext(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const key = contextKey(row.datasheetId, row.miniatureId);
    if (!map.has(key)) {
      map.set(key, new Map());
    }
    map.get(key).set(row.wargearItemId, row.key);
  }
  return map;
}

function buildCatalogIndexes(bootstrap, tables) {
  const {
    detachments,
    detachmentUniqueKeywords,
    detachmentRequiredDatasheets,
    detachmentLinkedDatasheets,
    detachmentMandatoryWarlordMiniatures,
    detachmentGrantedWarlordMiniatures,
    factionKeywords,
    datasheets,
    datasheetFactionKeywords,
    datasheetPointsSteps,
    datasheetBodyguardGroups,
    datasheetBodyguardGroupDatasheets,
    datasheetBodyguardGroupKeywords,
    unitCompositions,
    unitCompositionMiniatures,
    compositionRequiredFactionKeywords,
    compositionRequiredDetachments,
    miniatures,
    keywords,
    miniatureKeywords,
    conditionalKeywords,
    publications,
    detachmentForceDispositions,
    forceDispositions,
    factionKeywordMandatoryAllegianceAbilities,
    allegianceAbilityGroups,
    allegianceAbilities,
    enhancements,
    enhancementKeywordPointsCosts,
    enhancementExcludedKeywords,
    enhancementRequiredWargearItems,
    enhancementRequiredKeywordGroups,
    enhancementRequiredKeywordGroupKeywords,
    enhancementRequiredKeywordGroupFactionKeywords,
    enhancementBodyguardGroups,
    enhancementBodyguardGroupDatasheets,
    enhancementBodyguardGroupKeywords,
    alliedFactions,
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
    baseMiniatureLoadouts,
    baseMiniatureLoadoutWargearOptions,
    loadoutChoiceSets,
    loadoutChoices,
    loadoutChoiceWargearItems,
    limitedWargearChoiceSets,
    limitedWargearChoices,
    limitedWargearChoiceWargearItems,
    wargearLimits,
    allModelWargearChoiceSets,
    allModelWargearChoices,
    allModelWargearChoiceWargearItems,
    wargearGroups,
    wargearOptions,
    wargearItems,
  } = tables;

  return {
    wargearAliases: bootstrap.wargearAliases || [],
    wargearAliasesByContext: wargearAliasesByContext(bootstrap.wargearAliases || []),
    factionById: byId(bootstrap.factions || []),
    battleSizeById: byId(bootstrap.battleSizes || []),
    detachmentById: byId(detachments),
    factionKeywordById: byId(factionKeywords),
    datasheetById: byId(datasheets),
    compositionById: byId(unitCompositions),
    miniatureById: byId(miniatures),
    keywordById: byId(keywords),
    publicationById: byId(publications),
    forceDispositionById: byId(forceDispositions),
    allegianceAbilityGroupById: byId(allegianceAbilityGroups),
    allegianceAbilityById: byId(allegianceAbilities),
    enhancementById: byId(enhancements),
    alliedFactionById: byId(alliedFactions),
    wargearGroupById: byId(wargearGroups),
    wargearOptionById: byId(wargearOptions),
    wargearItemById: byId(wargearItems),
    detachmentUniqueKeywordsByDetachmentId: groupBy(detachmentUniqueKeywords, "detachmentId"),
    detachmentRequiredDatasheetsByDetachmentId: groupBy(detachmentRequiredDatasheets, "detachmentId"),
    detachmentLinkedDatasheetsByDetachmentId: groupBy(detachmentLinkedDatasheets, "detachmentId"),
    detachmentMandatoryWarlordsByDetachmentId: groupBy(detachmentMandatoryWarlordMiniatures, "detachmentId"),
    detachmentGrantedWarlordsByMiniatureId: groupBy(detachmentGrantedWarlordMiniatures, "miniatureId"),
    datasheetFactionKeywordsByDatasheetId: groupBy(datasheetFactionKeywords, "datasheetId"),
    datasheetPointsStepsByDatasheetId: groupBy(datasheetPointsSteps, "datasheetId"),
    datasheetBodyguardGroupsByDatasheetId: groupBy(datasheetBodyguardGroups, "datasheetId"),
    datasheetBodyguardGroupDatasheetsByGroupId: groupBy(datasheetBodyguardGroupDatasheets, "datasheetBodyguardGroupId"),
    datasheetBodyguardGroupKeywordsByGroupId: groupBy(datasheetBodyguardGroupKeywords, "datasheetBodyguardGroupId"),
    forceDispositionsByDetachmentId: groupBy(detachmentForceDispositions, "detachmentId"),
    compositionsByDatasheetId: groupBy(unitCompositions, "datasheetId"),
    compositionMiniaturesByCompositionId: groupBy(unitCompositionMiniatures, "unitCompositionId"),
    requiredFactionKeywordsByCompositionId: groupBy(compositionRequiredFactionKeywords, "unitCompositionId"),
    requiredDetachmentsByCompositionId: groupBy(compositionRequiredDetachments, "unitCompositionId"),
    miniaturesByDatasheetId: groupBy(miniatures, "datasheetId"),
    miniatureKeywordsByMiniatureId: groupBy(miniatureKeywords, "miniatureId"),
    conditionalKeywordsByDatasheetId: groupBy(conditionalKeywords, "datasheetId"),
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
    baseMiniatureLoadoutsByMiniatureId: groupBy(baseMiniatureLoadouts, "miniatureId"),
    baseMiniatureLoadoutsByDatasheetId: groupBy(baseMiniatureLoadouts, "datasheetId"),
    baseMiniatureLoadoutWargearOptionsByLoadoutId: groupBy(baseMiniatureLoadoutWargearOptions, "baseMiniatureLoadoutId"),
    loadoutChoiceSetsByDatasheetId: groupBy(loadoutChoiceSets, "datasheetId"),
    loadoutChoicesBySetId: groupBy(loadoutChoices, "loadoutChoiceSetId"),
    loadoutChoiceItemsByChoiceId: groupBy(loadoutChoiceWargearItems, "loadoutChoiceId"),
    limitedWargearChoiceSetsByDatasheetId: groupBy(limitedWargearChoiceSets, "datasheetId"),
    limitedWargearChoicesBySetId: groupBy(limitedWargearChoices, "limitedWargearChoiceSetId"),
    limitedWargearChoiceItemsByChoiceId: groupBy(limitedWargearChoiceWargearItems, "limitedWargearChoiceId"),
    wargearLimitsByLimitedSetId: groupBy(wargearLimits, "limitedWargearChoiceSetId"),
    allModelWargearChoiceSetsByDatasheetId: groupBy(allModelWargearChoiceSets, "datasheetId"),
    allModelWargearChoicesBySetId: groupBy(allModelWargearChoices, "allModelWargearChoiceSetId"),
    allModelWargearChoiceItemsByChoiceId: groupBy(allModelWargearChoiceWargearItems, "allModelWargearChoiceId"),
    wargearGroupsByDatasheetId: groupBy(wargearGroups, "datasheetId"),
    wargearOptionsByGroupId: groupBy(wargearOptions, "wargearOptionGroupId"),
  };
}

export { buildCatalogIndexes };
