import assert from "node:assert/strict";
import test from "node:test";
import {
  state,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  factionScope,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateEnhancements,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  validateRoster,
  validateWargearLoadouts,
  validateWarlord,
  realCatalog,
  withCatalog,
  messageCodes,
  rowNamed,
  factionNamed,
  battleSizeNamed,
  detachmentNamed,
  keywordNamed,
  miniatureNamed,
  datasheetNamed,
  combatPatrolDatasheetNamed,
  rosterUnitRef,
  rosterUnitFromDatasheetId,
  enhancementNamed,
  miniatureNamedForDatasheet,
  datasheetNamedForAlly,
  keywordIdsForDatasheet,
  alliedFactionWithParent,
  alliedFactionForRosterAndParent,
  alliedUnit,
  alliedUnitWarlord,
  allegianceGroup,
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceUnit,
  defaultCompositionForDatasheet,
  defaultWargearUnit,
  miniatureInUnit,
  optionIdForMiniatureItem,
  setMiniatureWargear,
  enhancementTargetUnit,
  withMiniatureEnhancement,
  datasheetIdForEnhancementBodyguard
} from "./builder_validation_helpers.mjs";
export {
  assert,
  test,
  state,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  factionScope,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateEnhancements,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  validateRoster,
  validateWargearLoadouts,
  validateWarlord,
  realCatalog,
  withCatalog,
  messageCodes,
  rowNamed,
  factionNamed,
  battleSizeNamed,
  detachmentNamed,
  keywordNamed,
  miniatureNamed,
  datasheetNamed,
  combatPatrolDatasheetNamed,
  rosterUnitRef,
  rosterUnitFromDatasheetId,
  enhancementNamed,
  miniatureNamedForDatasheet,
  datasheetNamedForAlly,
  keywordIdsForDatasheet,
  alliedFactionWithParent,
  alliedFactionForRosterAndParent,
  alliedUnit,
  alliedUnitWarlord,
  allegianceGroup,
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceUnit,
  defaultCompositionForDatasheet,
  defaultWargearUnit,
  miniatureInUnit,
  optionIdForMiniatureItem,
  setMiniatureWargear,
  enhancementTargetUnit,
  withMiniatureEnhancement,
  datasheetIdForEnhancementBodyguard,
};

export function firstRosterFactionForAlliedFaction(alliedFactionId) {
  const row = realCatalog.factionKeywordAlliedFactions.find((item) => item.alliedFactionId === alliedFactionId);
  assert.ok(row, `Expected roster faction for allied faction ${alliedFactionId}`);
  return row.factionKeywordId;
}

export function firstRosterFactionWithoutAlliedFaction(alliedFactionId) {
  const faction = realCatalog.factionKeywords.find((candidate) => !(
    realCatalog.factionAlliedFactionsByFactionId.get(candidate.id) || []
  ).some((row) => row.alliedFactionId === alliedFactionId));
  assert.ok(faction, `Expected roster faction without allied faction ${alliedFactionId}`);
  return faction.id;
}

export function alliedFactionForRestrictingKeyword(keyword) {
  const parent = realCatalog.alliedFactionParentFactionKeywords.find((row) => (
    factionScope(row.factionKeywordId).includes(keyword.allyRestrictingFactionKeywordId)
  ));
  assert.ok(parent, `Expected allied faction parent for restricting keyword ${keyword.name}`);
  return parent.alliedFactionId;
}

export function firstDatasheetForAlliedFaction(alliedFactionId) {
  const row = (realCatalog.alliedFactionDatasheetsByAlliedFactionId.get(alliedFactionId) || [])[0];
  assert.ok(row, `Expected datasheet for allied faction ${alliedFactionId}`);
  const datasheet = realCatalog.datasheetById.get(row.datasheetId);
  assert.ok(datasheet, `Expected datasheet ${row.datasheetId}`);
  return datasheet;
}

export function firstDatasheetOutsideAlliedFaction(alliedFactionId) {
  const allowedIds = new Set(
    (realCatalog.alliedFactionDatasheetsByAlliedFactionId.get(alliedFactionId) || [])
      .map((row) => row.datasheetId)
  );
  const datasheet = realCatalog.datasheets.find((candidate) => !allowedIds.has(candidate.id));
  assert.ok(datasheet, `Expected datasheet outside allied faction ${alliedFactionId}`);
  return datasheet;
}

export function datasheetForAlliedKeywordIds(alliedFactionId, keywordIds) {
  const datasheet = (realCatalog.alliedFactionDatasheetsByAlliedFactionId.get(alliedFactionId) || [])
    .map((row) => realCatalog.datasheetById.get(row.datasheetId))
    .filter(Boolean)
    .find((item) => keywordIds.every((keywordId) => keywordIdsForDatasheet(item.id).includes(keywordId)));
  assert.ok(datasheet, `Expected allied datasheet for ${alliedFactionId} with keywords ${keywordIds.join(", ")}`);
  return datasheet;
}

export function datasheetForAlliedKeywordPresence(alliedFactionId, requiredKeywordId, forbiddenKeywordId = "") {
  const datasheet = (realCatalog.alliedFactionDatasheetsByAlliedFactionId.get(alliedFactionId) || [])
    .map((row) => realCatalog.datasheetById.get(row.datasheetId))
    .filter(Boolean)
    .find((item) => {
      const keywordIds = keywordIdsForDatasheet(item.id);
      return keywordIds.includes(requiredKeywordId)
        && (!forbiddenKeywordId || !keywordIds.includes(forbiddenKeywordId));
    });
  assert.ok(datasheet, `Expected allied datasheet for ${alliedFactionId} with keyword ${requiredKeywordId}`);
  return datasheet;
}

export function datasheetForMiniature(miniatureId) {
  const miniature = realCatalog.miniatureById.get(miniatureId);
  assert.ok(miniature, `Expected miniature ${miniatureId}`);
  const datasheet = realCatalog.datasheetById.get(miniature.datasheetId);
  assert.ok(datasheet, `Expected datasheet for miniature ${miniatureId}`);
  return datasheet;
}

export function catalogAlliedUnit({
  id,
  alliedFactionId,
  points,
  datasheet = firstDatasheetForAlliedFaction(alliedFactionId),
  warlordMiniatureIds = [],
}) {
  return {
    id,
    name: datasheet.name,
    datasheetId: datasheet.id,
    allyType: alliedFactionId,
    keywordIds: keywordIdsForDatasheet(datasheet.id),
    points,
    warlordMiniatureIds,
  };
}

export function alliedKeywordUnits(row, count, idPrefix) {
  const datasheet = datasheetForAlliedKeywordIds(row.alliedFactionId, [row.keywordId]);
  return Array.from({ length: count }, (_, index) => catalogAlliedUnit({
    id: `${idPrefix}-${index}`,
    alliedFactionId: row.alliedFactionId,
    datasheet,
    points: 0,
    warlordMiniatureIds: index === 0 && row.requiredWarlordMiniatureId
      ? [row.requiredWarlordMiniatureId]
      : [],
  }));
}
