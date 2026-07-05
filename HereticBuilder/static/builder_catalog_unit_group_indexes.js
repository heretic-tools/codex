import { groupBy } from "./builder_catalog_index_helpers.js";

function buildUnitGroupIndexes(tables) {
  const {
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
    miniatureKeywords,
    conditionalKeywords,
  } = tables;

  return {
    datasheetFactionKeywordsByDatasheetId: groupBy(datasheetFactionKeywords, "datasheetId"),
    datasheetPointsStepsByDatasheetId: groupBy(datasheetPointsSteps, "datasheetId"),
    datasheetBodyguardGroupsByDatasheetId: groupBy(datasheetBodyguardGroups, "datasheetId"),
    datasheetBodyguardGroupDatasheetsByGroupId: groupBy(datasheetBodyguardGroupDatasheets, "datasheetBodyguardGroupId"),
    datasheetBodyguardGroupKeywordsByGroupId: groupBy(datasheetBodyguardGroupKeywords, "datasheetBodyguardGroupId"),
    compositionsByDatasheetId: groupBy(unitCompositions, "datasheetId"),
    compositionMiniaturesByCompositionId: groupBy(unitCompositionMiniatures, "unitCompositionId"),
    requiredFactionKeywordsByCompositionId: groupBy(compositionRequiredFactionKeywords, "unitCompositionId"),
    requiredDetachmentsByCompositionId: groupBy(compositionRequiredDetachments, "unitCompositionId"),
    miniaturesByDatasheetId: groupBy(miniatures, "datasheetId"),
    miniatureKeywordsByMiniatureId: groupBy(miniatureKeywords, "miniatureId"),
    conditionalKeywordsByDatasheetId: groupBy(conditionalKeywords, "datasheetId"),
  };
}

export { buildUnitGroupIndexes };
