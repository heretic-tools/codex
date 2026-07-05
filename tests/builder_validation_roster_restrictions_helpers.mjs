import assert from "node:assert/strict";
import test from "node:test";

import {
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceGroup,
  allegianceUnit,
  alliedFactionForRosterAndParent,
  alliedFactionWithParent,
  alliedUnit,
  alliedUnitWarlord,
  availableCompositions,
  availableDatasheets,
  availableDetachments,
  battleSizeNamed,
  combatPatrolDatasheetNamed,
  costForDetachment,
  datasheetFactionIds,
  datasheetIdForEnhancementBodyguard,
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  datasheetNamed,
  datasheetNamedForAlly,
  defaultCompositionForDatasheet,
  defaultMiniatures,
  defaultWargear,
  defaultWargearUnit,
  detachmentDispositionName,
  detachmentNamed,
  enhancementNamed,
  enhancementTargetUnit,
  factionExcludesDatasheet,
  factionNamed,
  factionScope,
  keywordIdsForDatasheet,
  keywordNamed,
  messageCodes,
  miniatureInUnit,
  miniatureNamed,
  miniatureNamedForDatasheet,
  optionIdForMiniatureItem,
  realCatalog,
  rosterUnitFromDatasheetId,
  rosterUnitRef,
  setMiniatureWargear,
  state,
  unitSummary,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateEnhancements,
  validateKeywordRestrictions,
  validateRoster,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  validateWargearLoadouts,
  validateWarlord,
  warlordCandidateStatus,
  withCatalog,
  withMiniatureEnhancement,
} from "./builder_validation_helpers.mjs";

import {
  availableDatasheets as modelAvailableDatasheets,
  availableUnitSources as modelAvailableUnitSources,
  compositionFactionIds as modelCompositionFactionIds,
  compositionLabel as modelCompositionLabel,
  detachmentBadgeNode as modelDetachmentBadgeNode,
  detachmentDispositionBadgeNode as modelDetachmentDispositionBadgeNode,
  rosterPoints as modelRosterPoints,
  rosterUnitSummaries as modelRosterUnitSummaries,
  selectedAllegianceAbilities as modelSelectedAllegianceAbilities,
} from "../HereticBuilder/static/builder_model.js";

function compositionMiniatureRows(composition) {
  return realCatalog.compositionMiniaturesByCompositionId.get(composition.id) || [];
}

function compositionRequiredFactionRows(composition) {
  return realCatalog.requiredFactionKeywordsByCompositionId.get(composition.id) || [];
}

function compositionRequiredDetachmentRows(composition) {
  return realCatalog.requiredDetachmentsByCompositionId.get(composition.id) || [];
}

function catalogWithOnlyComposition(composition) {
  return {
    ...realCatalog,
    compositionById: new Map([[composition.id, composition]]),
    compositionsByDatasheetId: new Map([[composition.datasheetId, [composition]]]),
    compositionMiniaturesByCompositionId: new Map([[composition.id, compositionMiniatureRows(composition)]]),
    requiredFactionKeywordsByCompositionId: new Map([[composition.id, compositionRequiredFactionRows(composition)]]),
    requiredDetachmentsByCompositionId: new Map([[composition.id, compositionRequiredDetachmentRows(composition)]]),
  };
}

function availableCompositionIds(composition, factionKeywordIds, detachmentIds) {
  let ids = [];
  withCatalog(catalogWithOnlyComposition(composition), () => {
    ids = availableCompositions(composition.datasheetId, factionKeywordIds, detachmentIds)
      .map((row) => row.id);
  });
  return ids;
}

function defaultMiniaturesForComposition(composition) {
  let miniatures = [];
  withCatalog(catalogWithOnlyComposition(composition), () => {
    miniatures = defaultMiniatures(composition.datasheetId, composition.id);
  });
  return miniatures;
}

function catalogWithOnlyDatasheetPointsStep(row) {
  return {
    ...realCatalog,
    datasheetPointsSteps: [row],
    datasheetPointsStepsByDatasheetId: new Map([[row.datasheetId, [row]]]),
  };
}

function unitSummariesForPointsStep(row) {
  const units = Array.from({ length: Number(row.stepAt || 0) + 1 }, (_, index) => ({
    id: `${row.datasheetId}:step:${index + 1}`,
    datasheetId: row.datasheetId,
  }));
  const roster = {
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units,
  };
  let summaries = [];
  withCatalog(catalogWithOnlyDatasheetPointsStep(row), () => {
    summaries = units.map((unit) => unitSummary(roster, unit));
  });
  return summaries;
}

function rosterFactionIdForDatasheet(datasheetId) {
  const row = realCatalog.datasheetFactionKeywordsByDatasheetId.get(datasheetId)?.[0];
  assert.ok(row, `Expected datasheet ${datasheetId} to have a faction keyword`);
  return row.factionKeywordId;
}

function datasheetKeywordNameSet(datasheetId) {
  return new Set(keywordIdsForDatasheet(datasheetId)
    .map((keywordId) => realCatalog.keywordById.get(keywordId)?.name)
    .filter(Boolean));
}

function warlordUnitForMiniature(miniatureId, id, options = {}) {
  const miniature = realCatalog.miniatureById.get(miniatureId);
  assert.ok(miniature, `Expected miniature ${miniatureId}`);
  const datasheet = realCatalog.datasheetById.get(miniature.datasheetId);
  assert.ok(datasheet, `Expected datasheet for ${miniature.name}`);
  const rosterUnitMiniatureId = `${id}:${miniatureId}`;
  const isWarlord = Boolean(options.isWarlord);
  return {
    id,
    name: datasheet.name,
    datasheetId: datasheet.id,
    allyType: "native",
    factionKeywordIds: (realCatalog.datasheetFactionKeywordsByDatasheetId.get(datasheet.id) || [])
      .map((row) => row.factionKeywordId),
    keywordIds: keywordIdsForDatasheet(datasheet.id),
    keywordNames: [],
    warlordMiniatureIds: isWarlord ? [miniatureId] : [],
    unitEnhancements: [],
    miniatureEnhancements: [],
    allegianceAbilities: [],
    miniatures: [{
      ...miniature,
      id: rosterUnitMiniatureId,
      rosterUnitMiniatureId,
      miniatureId,
      count: options.count ?? 1,
      isWarlord,
      wargear: {},
    }],
  };
}

export {
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceGroup,
  allegianceUnit,
  alliedFactionForRosterAndParent,
  alliedFactionWithParent,
  alliedUnit,
  alliedUnitWarlord,
  assert,
  availableCompositionIds,
  availableCompositions,
  availableDatasheets,
  availableDetachments,
  battleSizeNamed,
  catalogWithOnlyDatasheetPointsStep,
  compositionMiniatureRows,
  compositionRequiredDetachmentRows,
  compositionRequiredFactionRows,
  combatPatrolDatasheetNamed,
  costForDetachment,
  datasheetFactionIds,
  datasheetIdForEnhancementBodyguard,
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  datasheetKeywordNameSet,
  datasheetNamed,
  datasheetNamedForAlly,
  defaultCompositionForDatasheet,
  defaultMiniaturesForComposition,
  defaultMiniatures,
  defaultWargear,
  defaultWargearUnit,
  detachmentDispositionName,
  detachmentNamed,
  enhancementNamed,
  enhancementTargetUnit,
  factionExcludesDatasheet,
  factionNamed,
  factionScope,
  keywordIdsForDatasheet,
  keywordNamed,
  messageCodes,
  miniatureInUnit,
  miniatureNamed,
  miniatureNamedForDatasheet,
  modelAvailableDatasheets,
  modelAvailableUnitSources,
  modelCompositionFactionIds,
  modelCompositionLabel,
  modelDetachmentBadgeNode,
  modelDetachmentDispositionBadgeNode,
  modelRosterPoints,
  modelRosterUnitSummaries,
  modelSelectedAllegianceAbilities,
  optionIdForMiniatureItem,
  realCatalog,
  rosterFactionIdForDatasheet,
  rosterUnitFromDatasheetId,
  rosterUnitRef,
  setMiniatureWargear,
  state,
  test,
  unitSummary,
  unitSummariesForPointsStep,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateEnhancements,
  validateKeywordRestrictions,
  validateRoster,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  validateWargearLoadouts,
  validateWarlord,
  warlordCandidateStatus,
  warlordUnitForMiniature,
  withCatalog,
  withMiniatureEnhancement,
};
