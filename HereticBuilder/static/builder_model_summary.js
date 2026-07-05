import { state } from "./builder_state.js";
import {
  idsFromRows,
  miniatureKeywordIds,
  unique,
} from "./builder_model_core.js";
import {
  compositionFactionIds,
  selectedAllegianceAbilities,
  selectedMiniatureEnhancements,
  selectedUnitEnhancements,
} from "./builder_model_selections.js";
import {
  compositionIsAvailable,
  effectiveComposition,
  miniaturesForUnit,
} from "./builder_model_compositions.js";
import {
  conditionalKeywordRowsForUnit,
  rosterWarlordMiniatureIds,
  unitKeywords,
} from "./builder_model_keywords.js";
import {
  datasheetPointsStepForUnit,
  enhancementPoints,
} from "./builder_model_points.js";
import { wargearPoints } from "./builder_model_wargear.js";

function unitSummary(roster, unit) {
  const datasheet = state.catalog.datasheetById.get(unit.datasheetId) || {};
  const allyType = unit.allyType || "native";
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = effectiveComposition(unit, factionIds, roster.detachmentIds || []);
  const miniatures = miniaturesForUnit(unit, composition);
  const selectedAbilities = selectedAllegianceAbilities(unit);
  const ownWarlordMiniatureIds = miniatures.filter((item) => item.isWarlord && item.count > 0).map((item) => item.miniatureId);
  const rosterWarlordIds = new Set([...rosterWarlordMiniatureIds(roster), ...ownWarlordMiniatureIds]);
  const conditionalKeywordRows = conditionalKeywordRowsForUnit(roster, unit, selectedAbilities, rosterWarlordIds);
  const conditionalKeywordIds = unique(conditionalKeywordRows.map((item) => item.keywordId));
  const keywords = unitKeywords(roster, unit, miniatures, selectedAbilities, rosterWarlordIds, conditionalKeywordRows);
  const keywordIds = keywords.map((item) => item.id);
  const unitEnhancements = selectedUnitEnhancements(unit).map((enhancement) => ({
    ...enhancement,
    points: enhancementPoints(enhancement.id, keywordIds),
  }));
  const miniatureEnhancements = selectedMiniatureEnhancements(unit).map((enhancement) => {
    const miniature = miniatures.find((item) => (
      item.rosterUnitMiniatureId === enhancement.targetId || item.id === enhancement.targetId
    ));
    const targetKeywordIds = miniature ? unique([...miniatureKeywordIds(miniature.miniatureId), ...conditionalKeywordIds]) : keywordIds;
    return {
      ...enhancement,
      points: enhancementPoints(enhancement.id, targetKeywordIds),
    };
  });
  const compositionAvailable = composition ? compositionIsAvailable(composition, factionIds, roster.detachmentIds || []) : false;
  const points = (composition?.points || 0)
    + datasheetPointsStepForUnit(roster, unit)
    + wargearPoints(unit)
    + unitEnhancements.reduce((total, enhancement) => total + (enhancement.points || 0), 0)
    + miniatureEnhancements.reduce((total, enhancement) => total + (enhancement.points || 0), 0);
  return {
    ...unit,
    allyType,
    name: datasheet.name || unit.name || "Unit",
    compositionId: composition?.id || unit.compositionId || "",
    points,
    datasheetPointsStep: datasheetPointsStepForUnit(roster, unit),
    modelCount: miniatures.reduce((total, miniature) => total + (miniature.count || 0), 0),
    maxModelCount: datasheet.maxModelCount,
    isSuccessorChapter: Boolean(datasheet.isSuccessorChapter),
    allegianceAbilityGroupId: datasheet.allegianceAbilityGroupId,
    selectedCompositionId: composition?.id || "",
    selectedCompositionAvailable: compositionAvailable,
    keywordIds,
    conditionalKeywordIds,
    keywordNames: keywords.map((item) => item.name),
    factionKeywordIds: idsFromRows(state.catalog.datasheetFactionKeywordsByDatasheetId.get(unit.datasheetId), "factionKeywordId"),
    isWarlord: ownWarlordMiniatureIds.length > 0,
    warlordMiniatureIds: ownWarlordMiniatureIds,
    miniatures,
    allegianceAbilities: selectedAbilities,
    unitEnhancements,
    miniatureEnhancements,
  };
}

function rosterUnitSummaries(roster) {
  return (roster.units || []).map((unit) => unitSummary(roster, unit));
}

function rosterPoints(roster) {
  return rosterUnitSummaries(roster).reduce((total, unit) => total + (unit.points || 0), 0);
}

export {
  enhancementPoints,
  rosterPoints,
  rosterUnitSummaries,
  unitSummary,
};
