import { state } from "./builder_state.js";

function datasheetPointsStepForUnit(roster, unit) {
  const step = state.catalog.datasheetPointsStepsByDatasheetId.get(unit.datasheetId)?.[0];
  if (!step) {
    return 0;
  }
  const sameDatasheetIds = (roster.units || [])
    .filter((candidate) => candidate.datasheetId === unit.datasheetId)
    .map((candidate) => candidate.id);
  const position = sameDatasheetIds.indexOf(unit.id) + 1;
  return position >= (step.stepAt || 0) ? (step.stepPoints || 0) : 0;
}

function enhancementPoints(enhancementId, keywordIds) {
  const keywordSet = new Set(keywordIds || []);
  const override = [...(state.catalog.enhancementKeywordPointsCostsByEnhancementId.get(enhancementId) || [])]
    .sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0))
    .find((row) => keywordSet.has(row.keywordId));
  const enhancement = state.catalog.enhancementById.get(enhancementId);
  return override?.pointsCost ?? enhancement?.basePointsCost ?? 0;
}

export {
  datasheetPointsStepForUnit,
  enhancementPoints,
};
