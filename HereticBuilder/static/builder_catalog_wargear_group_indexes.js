import { groupBy } from "./builder_catalog_index_helpers.js";

function buildWargearGroupIndexes(tables) {
  const {
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
  } = tables;

  return {
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

export { buildWargearGroupIndexes };
