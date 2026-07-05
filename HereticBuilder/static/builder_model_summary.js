import { state } from "./builder_state.js";
import { idsFromRows } from "./builder_model_core.js";
import { compositionFactionIds } from "./builder_model_selections.js";
import {
  compositionIsAvailable,
  effectiveComposition,
  miniaturesForUnit,
} from "./builder_model_compositions.js";
import { enhancementPoints } from "./builder_model_points.js";
import { summaryEnhancements } from "./builder_model_summary_enhancements.js";
import { summaryKeywordState } from "./builder_model_summary_keywords.js";
import { summaryPoints } from "./builder_model_summary_points.js";

function unitSummary(roster, unit) {
  const datasheet = state.catalog.datasheetById.get(unit.datasheetId) || {};
  const allyType = unit.allyType || "native";
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = effectiveComposition(unit, factionIds, roster.detachmentIds || []);
  const miniatures = miniaturesForUnit(unit, composition);
  const keywordState = summaryKeywordState(roster, unit, miniatures);
  const { miniatureEnhancements, unitEnhancements } = summaryEnhancements(
    unit,
    miniatures,
    keywordState.keywordIds,
    keywordState.conditionalKeywordIds
  );
  const compositionAvailable = composition ? compositionIsAvailable(composition, factionIds, roster.detachmentIds || []) : false;
  const { datasheetPointsStep, points } = summaryPoints(roster, unit, composition, unitEnhancements, miniatureEnhancements);
  return {
    ...unit,
    allyType,
    name: datasheet.name || unit.name || "Unit",
    compositionId: composition?.id || unit.compositionId || "",
    points,
    datasheetPointsStep,
    modelCount: miniatures.reduce((total, miniature) => total + (miniature.count || 0), 0),
    maxModelCount: datasheet.maxModelCount,
    isSuccessorChapter: Boolean(datasheet.isSuccessorChapter),
    allegianceAbilityGroupId: datasheet.allegianceAbilityGroupId,
    selectedCompositionId: composition?.id || "",
    selectedCompositionAvailable: compositionAvailable,
    keywordIds: keywordState.keywordIds,
    conditionalKeywordIds: keywordState.conditionalKeywordIds,
    keywordNames: keywordState.keywordNames,
    factionKeywordIds: idsFromRows(state.catalog.datasheetFactionKeywordsByDatasheetId.get(unit.datasheetId), "factionKeywordId"),
    isWarlord: keywordState.ownWarlordMiniatureIds.length > 0,
    warlordMiniatureIds: keywordState.ownWarlordMiniatureIds,
    miniatures,
    allegianceAbilities: keywordState.selectedAbilities,
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
