import {
  byId,
  precomputedLoadoutsByContext,
  unitImagesByDatasheetId,
  wargearAliasesByContext,
} from "./builder_catalog_index_helpers.js";

function buildCatalogIdIndexes(bootstrap, tables) {
  const {
    detachments,
    factionKeywords,
    datasheets,
    unitCompositions,
    miniatures,
    keywords,
    publications,
    forceDispositions,
    allegianceAbilityGroups,
    allegianceAbilities,
    enhancements,
    alliedFactions,
    wargearGroups,
    wargearOptions,
    wargearItems,
    precomputedLoadouts,
    unitImages,
  } = tables;

  return {
    wargearAliases: bootstrap.wargearAliases || [],
    wargearAliasesByContext: wargearAliasesByContext(bootstrap.wargearAliases || []),
    precomputedLoadouts: precomputedLoadouts || null,
    precomputedLoadoutsByContext: precomputedLoadoutsByContext(precomputedLoadouts?.contexts || []),
    unitImagesByDatasheetId: unitImagesByDatasheetId(unitImages),
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
  };
}

export { buildCatalogIdIndexes };
