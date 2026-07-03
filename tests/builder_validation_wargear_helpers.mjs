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
  canonicalWargearKey,
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
import {
  addCounts,
  loadoutChoiceSets,
  validLoadoutsFromChoiceSets,
  wargearLoadoutMatchesChoiceSets,
} from "../HereticBuilder/static/builder_loadout_math.js";
import { wargearPoints } from "../HereticBuilder/static/builder_model.js";
export { assert, test, state, costForDetachment, defaultMiniatures, defaultWargear, factionScope, validateAllegianceAbilities, validateAlliedUnits, validateAttachedUnits, validateEnhancements, validateDetachmentDatasheets, validateDetachmentUniqueKeywords, validateKeywordRestrictions, validateSuccessorChapterEpicHeroes, validateUnitCompositions, validateRoster, validateWargearLoadouts, validateWarlord, realCatalog, withCatalog, messageCodes, rowNamed, factionNamed, battleSizeNamed, detachmentNamed, keywordNamed, miniatureNamed, datasheetNamed, combatPatrolDatasheetNamed, canonicalWargearKey, rosterUnitRef, rosterUnitFromDatasheetId, enhancementNamed, miniatureNamedForDatasheet, datasheetNamedForAlly, keywordIdsForDatasheet, alliedFactionWithParent, alliedFactionForRosterAndParent, alliedUnit, alliedUnitWarlord, allegianceGroup, allegianceAbility, allegianceAbilityWithRequiredWargear, allegianceUnit, defaultCompositionForDatasheet, defaultWargearUnit, miniatureInUnit, optionIdForMiniatureItem, setMiniatureWargear, enhancementTargetUnit, withMiniatureEnhancement, datasheetIdForEnhancementBodyguard, addCounts, loadoutChoiceSets, validLoadoutsFromChoiceSets, wargearLoadoutMatchesChoiceSets, wargearPoints };
export function addNameAliasContext(contexts, { source, datasheetId, miniatureId, wargearItemId }) {
  const key = canonicalWargearKey(wargearItemId, { datasheetId, miniatureId });
  if (!key.startsWith("name:")) {
    return;
  }
  const contextKey = `${datasheetId}|${miniatureId || ""}|${key}`;
  if (!contexts.has(contextKey)) {
    contexts.set(contextKey, {
      datasheet: realCatalog.datasheetById.get(datasheetId)?.name,
      miniature: realCatalog.miniatureById.get(miniatureId)?.name || "<unit>",
      key,
      itemIds: new Set(),
      sources: new Set(),
    });
  }
  const context = contexts.get(contextKey);
  context.itemIds.add(wargearItemId);
  context.sources.add(source);
}

export function auditedNameAliasContexts() {
  const contexts = new Map();
  for (const set of realCatalog.loadoutChoiceSets || []) {
    for (const choice of realCatalog.loadoutChoicesBySetId.get(set.id) || []) {
      for (const row of realCatalog.loadoutChoiceItemsByChoiceId.get(choice.id) || []) {
        addNameAliasContext(contexts, {
          source: "loadout",
          datasheetId: set.datasheetId,
          miniatureId: set.miniatureId,
          wargearItemId: row.wargearItemId,
        });
      }
    }
  }
  for (const set of realCatalog.limitedWargearChoiceSets || []) {
    for (const choice of realCatalog.limitedWargearChoicesBySetId.get(set.id) || []) {
      for (const row of realCatalog.limitedWargearChoiceItemsByChoiceId.get(choice.id) || []) {
        addNameAliasContext(contexts, {
          source: "limited",
          datasheetId: set.datasheetId,
          miniatureId: set.miniatureId,
          wargearItemId: row.wargearItemId,
        });
      }
    }
  }
  for (const set of realCatalog.allModelWargearChoiceSets || []) {
    for (const choice of realCatalog.allModelWargearChoicesBySetId.get(set.id) || []) {
      for (const row of realCatalog.allModelWargearChoiceItemsByChoiceId.get(choice.id) || []) {
        addNameAliasContext(contexts, {
          source: "all_model",
          datasheetId: set.datasheetId,
          miniatureId: set.miniatureId,
          wargearItemId: row.wargearItemId,
        });
      }
    }
  }
  for (const group of realCatalog.wargearGroups || []) {
    for (const option of realCatalog.wargearOptionsByGroupId.get(group.id) || []) {
      addNameAliasContext(contexts, {
        source: "option",
        datasheetId: group.datasheetId,
        miniatureId: group.miniatureId,
        wargearItemId: option.wargearItemId,
      });
    }
  }
  return [...contexts.values()]
    .map((context) => ({
      datasheet: context.datasheet,
      miniature: context.miniature,
      key: context.key,
      itemIds: context.itemIds.size,
      sources: [...context.sources].sort(),
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function countBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    counts[String(row[key])] = (counts[String(row[key])] || 0) + 1;
  }
  return counts;
}

export function miniatureBelongsToDatasheet(datasheetId, miniatureId) {
  return (realCatalog.miniaturesByDatasheetId.get(datasheetId) || [])
    .some((miniature) => miniature.id === miniatureId);
}

export function catalogWithOnlyLoadoutChoiceSet(set) {
  const choices = realCatalog.loadoutChoicesBySetId.get(set.id) || [];
  return {
    ...realCatalog,
    loadoutChoiceSetsByDatasheetId: new Map([[set.datasheetId, [set]]]),
    loadoutChoicesBySetId: new Map([[set.id, choices]]),
    loadoutChoiceItemsByChoiceId: new Map(choices.map((choice) => [
      choice.id,
      realCatalog.loadoutChoiceItemsByChoiceId.get(choice.id) || [],
    ])),
  };
}

export function choiceIsRepresented(choice, loadouts) {
  const entries = Object.entries(choice || {});
  return loadouts.some((loadout) => entries.every(([key, count]) => (loadout[key] || 0) >= count));
}

export function invalidCountsForLoadout(loadout) {
  return {
    ...loadout,
    "id:not-a-live-loadout-choice": 1,
  };
}

export function limitedSetForChoice(choice) {
  const row = realCatalog.limitedWargearChoiceSets.find((set) => set.id === choice.limitedWargearChoiceSetId);
  assert.ok(row, `Expected limited wargear choice set ${choice.limitedWargearChoiceSetId}`);
  return row;
}

export function limitedSetForLimit(limit) {
  const row = realCatalog.limitedWargearChoiceSets.find((set) => set.id === limit.limitedWargearChoiceSetId);
  assert.ok(row, `Expected limited wargear limit set ${limit.limitedWargearChoiceSetId}`);
  return row;
}

export function limitedChoiceRows(choice) {
  return realCatalog.limitedWargearChoiceItemsByChoiceId.get(choice.id) || [];
}

export function firstNonEmptyLimitedChoice(set) {
  const choice = (realCatalog.limitedWargearChoicesBySetId.get(set.id) || [])
    .find((row) => limitedChoiceRows(row).length);
  assert.ok(choice, `Expected non-empty limited choice for set ${set.id}`);
  return choice;
}

export function selectionRowsForChoice(choice, repeats) {
  const counts = new Map();
  for (const row of limitedChoiceRows(choice)) {
    counts.set(row.wargearItemId, (counts.get(row.wargearItemId) || 0) + Number(row.count || 0) * repeats);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([wargearItemId, count]) => ({ wargearItemId, count }));
}

export function syntheticOptionId(set, wargearItemId) {
  return `test-limited-option:${set.id}:${wargearItemId}`;
}

export function syntheticWargearRowsForChoices(set, choices) {
  const itemIds = new Set();
  for (const choice of choices) {
    for (const row of limitedChoiceRows(choice)) {
      itemIds.add(row.wargearItemId);
    }
  }
  const group = {
    id: `test-limited-group:${set.id}`,
    datasheetId: set.datasheetId,
    miniatureId: set.miniatureId || null,
    isStaticWargear: false,
  };
  const options = [...itemIds].map((wargearItemId) => ({
    id: syntheticOptionId(set, wargearItemId),
    wargearOptionGroupId: group.id,
    wargearItemId,
    defaultValue: 0,
    inputType: "stepper",
    points: 0,
  }));
  return { group, options };
}

export function syntheticRegularLoadoutRows(set, selectionRows) {
  const loadoutSet = {
    id: `test-regular-loadout:${set.id}`,
    datasheetId: set.datasheetId,
    miniatureId: set.miniatureId || null,
    limit: 1,
    allowDuplicates: false,
    alternate: false,
  };
  const emptyChoice = {
    id: `${loadoutSet.id}:empty`,
    loadoutChoiceSetId: loadoutSet.id,
  };
  const selectedChoice = {
    id: `${loadoutSet.id}:selected`,
    loadoutChoiceSetId: loadoutSet.id,
  };
  const choices = selectionRows.length ? [emptyChoice, selectedChoice] : [emptyChoice];
  const items = selectionRows.map((row) => ({
    id: `${selectedChoice.id}:${row.wargearItemId}`,
    loadoutChoiceId: selectedChoice.id,
    wargearItemId: row.wargearItemId,
    count: row.count,
  }));
  return { loadoutSet, choices, items, selectedChoiceId: selectedChoice.id };
}

export function catalogWithLimitedWargearScenario(set, limit, choice, selectionRows) {
  const choices = [choice];
  const { group, options } = syntheticWargearRowsForChoices(set, choices);
  const regular = syntheticRegularLoadoutRows(set, selectionRows);
  return {
    ...realCatalog,
    loadoutChoiceSetsByDatasheetId: new Map([[set.datasheetId, [regular.loadoutSet]]]),
    loadoutChoicesBySetId: new Map([[regular.loadoutSet.id, regular.choices]]),
    loadoutChoiceItemsByChoiceId: new Map([
      [regular.choices[0].id, []],
      ...(selectionRows.length ? [[regular.selectedChoiceId, regular.items]] : []),
    ]),
    limitedWargearChoiceSetsByDatasheetId: new Map([[set.datasheetId, [set]]]),
    limitedWargearChoicesBySetId: new Map([[set.id, choices]]),
    limitedWargearChoiceItemsByChoiceId: new Map([[choice.id, limitedChoiceRows(choice)]]),
    wargearLimitsByLimitedSetId: new Map([[set.id, [limit]]]),
    allModelWargearChoiceSetsByDatasheetId: new Map(),
    allModelWargearChoicesBySetId: new Map(),
    allModelWargearChoiceItemsByChoiceId: new Map(),
    wargearGroups: [group],
    wargearOptions: options,
    wargearGroupById: new Map([[group.id, group]]),
    wargearOptionById: new Map(options.map((option) => [option.id, option])),
    wargearGroupsByDatasheetId: new Map([[set.datasheetId, [group]]]),
    wargearOptionsByGroupId: new Map([[group.id, options]]),
  };
}

export function selectedOptionCountsForLimitedScenario(set, selectionRows) {
  return Object.fromEntries(selectionRows.map((row) => [
    syntheticOptionId(set, row.wargearItemId),
    row.count,
  ]));
}

export function unitForLimitedWargearScenario(set, limit, selectionRows) {
  const datasheet = realCatalog.datasheetById.get(set.datasheetId);
  const miniature = set.miniatureId
    ? realCatalog.miniatureById.get(set.miniatureId)
    : (realCatalog.miniaturesByDatasheetId.get(set.datasheetId) || [])[0];
  assert.ok(datasheet, `Expected datasheet ${set.datasheetId}`);
  assert.ok(miniature, `Expected target miniature for limited set ${set.id}`);

  const modelCount = Math.max(1, Number(limit.modelCount || 0));
  const selectedOptions = selectedOptionCountsForLimitedScenario(set, selectionRows);
  return {
    id: `test-limited-unit:${set.id}:${limit.id || limit.modelCount || "zero"}`,
    name: datasheet.name,
    datasheetId: set.datasheetId,
    modelCount,
    wargear: set.miniatureId ? {} : selectedOptions,
    miniatures: [{
      ...miniature,
      id: `test-limited-miniature:${set.id}:${miniature.id}`,
      rosterUnitMiniatureId: `test-limited-miniature:${set.id}:${miniature.id}`,
      miniatureId: miniature.id,
      name: miniature.name || "Model",
      count: modelCount,
      wargear: set.miniatureId ? selectedOptions : {},
    }],
  };
}

export function validateLimitedWargearScenario(set, limit, choice, repeats) {
  const selectionRows = selectionRowsForChoice(choice, repeats);
  const catalog = catalogWithLimitedWargearScenario(set, limit, choice, selectionRows);
  const unit = unitForLimitedWargearScenario(set, limit, selectionRows);
  const messages = [];
  withCatalog(catalog, () => validateWargearLoadouts([unit], messages));
  return messageCodes(messages);
}

export function allModelChoiceRows(choice) {
  return realCatalog.allModelWargearChoiceItemsByChoiceId.get(choice.id) || [];
}

export function allModelChoicesForSet(set) {
  return realCatalog.allModelWargearChoicesBySetId.get(set.id) || [];
}

export function allModelSelectionRows(choiceRepeats) {
  const counts = new Map();
  for (const [choice, repeats] of choiceRepeats) {
    for (const row of allModelChoiceRows(choice)) {
      counts.set(row.wargearItemId, (counts.get(row.wargearItemId) || 0) + Number(row.count || 0) * repeats);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([wargearItemId, count]) => ({ wargearItemId, count }));
}

export function syntheticAllModelOptionId(set, wargearItemId) {
  return `test-all-model-option:${set.id}:${wargearItemId}`;
}

export function syntheticWargearRowsForAllModelChoices(set, choices) {
  const itemIds = new Set();
  for (const choice of choices) {
    for (const row of allModelChoiceRows(choice)) {
      itemIds.add(row.wargearItemId);
    }
  }
  const group = {
    id: `test-all-model-group:${set.id}`,
    datasheetId: set.datasheetId,
    miniatureId: set.miniatureId || null,
    isStaticWargear: false,
  };
  const options = [...itemIds].map((wargearItemId) => ({
    id: syntheticAllModelOptionId(set, wargearItemId),
    wargearOptionGroupId: group.id,
    wargearItemId,
    defaultValue: 0,
    inputType: "stepper",
    points: 0,
  }));
  return { group, options };
}

export function catalogWithAllModelWargearScenario(set, selectionRows) {
  const choices = allModelChoicesForSet(set);
  const { group, options } = syntheticWargearRowsForAllModelChoices(set, choices);
  const regular = syntheticRegularLoadoutRows(set, selectionRows);
  return {
    ...realCatalog,
    loadoutChoiceSetsByDatasheetId: new Map([[set.datasheetId, [regular.loadoutSet]]]),
    loadoutChoicesBySetId: new Map([[regular.loadoutSet.id, regular.choices]]),
    loadoutChoiceItemsByChoiceId: new Map([
      [regular.choices[0].id, []],
      ...(selectionRows.length ? [[regular.selectedChoiceId, regular.items]] : []),
    ]),
    limitedWargearChoiceSetsByDatasheetId: new Map(),
    limitedWargearChoicesBySetId: new Map(),
    limitedWargearChoiceItemsByChoiceId: new Map(),
    wargearLimitsByLimitedSetId: new Map(),
    allModelWargearChoiceSetsByDatasheetId: new Map([[set.datasheetId, [set]]]),
    allModelWargearChoicesBySetId: new Map([[set.id, choices]]),
    allModelWargearChoiceItemsByChoiceId: new Map(choices.map((choice) => [
      choice.id,
      allModelChoiceRows(choice),
    ])),
    wargearGroups: [group],
    wargearOptions: options,
    wargearGroupById: new Map([[group.id, group]]),
    wargearOptionById: new Map(options.map((option) => [option.id, option])),
    wargearGroupsByDatasheetId: new Map([[set.datasheetId, [group]]]),
    wargearOptionsByGroupId: new Map([[group.id, options]]),
  };
}

export function selectedOptionCountsForAllModelScenario(set, selectionRows) {
  return Object.fromEntries(selectionRows.map((row) => [
    syntheticAllModelOptionId(set, row.wargearItemId),
    row.count,
  ]));
}

export function unitForAllModelWargearScenario(set, modelCount, selectionRows) {
  const datasheet = realCatalog.datasheetById.get(set.datasheetId);
  const miniature = set.miniatureId
    ? realCatalog.miniatureById.get(set.miniatureId)
    : (realCatalog.miniaturesByDatasheetId.get(set.datasheetId) || [])[0];
  assert.ok(datasheet, `Expected datasheet ${set.datasheetId}`);
  assert.ok(miniature, `Expected target miniature for all-model set ${set.id}`);

  const selectedOptions = selectedOptionCountsForAllModelScenario(set, selectionRows);
  return {
    id: `test-all-model-unit:${set.id}:${modelCount}`,
    name: datasheet.name,
    datasheetId: set.datasheetId,
    modelCount,
    wargear: set.miniatureId ? {} : selectedOptions,
    miniatures: [{
      ...miniature,
      id: `test-all-model-miniature:${set.id}:${miniature.id}`,
      rosterUnitMiniatureId: `test-all-model-miniature:${set.id}:${miniature.id}`,
      miniatureId: miniature.id,
      name: miniature.name || "Model",
      count: modelCount,
      wargear: set.miniatureId ? selectedOptions : {},
    }],
  };
}

export function validateAllModelWargearScenario(set, choiceRepeats, modelCount) {
  const selectionRows = allModelSelectionRows(choiceRepeats);
  const catalog = catalogWithAllModelWargearScenario(set, selectionRows);
  const unit = unitForAllModelWargearScenario(set, modelCount, selectionRows);
  const messages = [];
  withCatalog(catalog, () => validateWargearLoadouts([unit], messages));
  return messageCodes(messages);
}

export function baseLoadoutRows(loadout) {
  return realCatalog.baseMiniatureLoadoutWargearOptionsByLoadoutId.get(loadout.id) || [];
}

export function optionMatchesBaseLoadoutScope(loadout, optionId) {
  const option = realCatalog.wargearOptionById.get(optionId);
  const group = option ? realCatalog.wargearGroupById.get(option.wargearOptionGroupId) : null;
  return group?.datasheetId === loadout.datasheetId && group?.miniatureId === loadout.miniatureId;
}

export function directBaseLoadoutRows(loadout) {
  return baseLoadoutRows(loadout)
    .filter((row) => optionMatchesBaseLoadoutScope(loadout, row.wargearOptionId));
}

export function foreignBaseLoadoutRows(loadout) {
  return baseLoadoutRows(loadout)
    .filter((row) => !optionMatchesBaseLoadoutScope(loadout, row.wargearOptionId));
}

export function catalogWithOnlyBaseLoadout(loadout) {
  const composition = {
    id: `test-base-composition:${loadout.id}`,
    datasheetId: loadout.datasheetId,
    isDefault: true,
  };
  return {
    ...realCatalog,
    compositionById: new Map([
      ...realCatalog.compositionById,
      [composition.id, composition],
    ]),
    compositionMiniaturesByCompositionId: new Map([
      [composition.id, [{
        unitCompositionId: composition.id,
        miniatureId: loadout.miniatureId,
        min: 2,
      }]],
    ]),
    baseMiniatureLoadoutsByMiniatureId: new Map([[loadout.miniatureId, [loadout]]]),
    baseMiniatureLoadoutsByDatasheetId: new Map([[loadout.datasheetId, [loadout]]]),
    baseMiniatureLoadoutWargearOptionsByLoadoutId: new Map([[loadout.id, baseLoadoutRows(loadout)]]),
    loadoutChoiceSetsByDatasheetId: new Map(),
    loadoutChoicesBySetId: new Map(),
    loadoutChoiceItemsByChoiceId: new Map(),
  };
}

export function defaultMiniaturesForBaseLoadout(loadout) {
  const catalog = catalogWithOnlyBaseLoadout(loadout);
  let miniatures = [];
  withCatalog(catalog, () => {
    miniatures = defaultMiniatures(loadout.datasheetId, `test-base-composition:${loadout.id}`);
  });
  assert.equal(miniatures.length, 1, `Expected one synthetic miniature for base loadout ${loadout.id}`);
  return miniatures[0];
}

export function wargearGroupForOption(option) {
  const group = realCatalog.wargearGroupById.get(option.wargearOptionGroupId);
  assert.ok(group, `Expected wargear group ${option.wargearOptionGroupId}`);
  return group;
}

export function datasheetMiniatureForGroup(group) {
  const miniature = group.miniatureId
    ? realCatalog.miniatureById.get(group.miniatureId)
    : (realCatalog.miniaturesByDatasheetId.get(group.datasheetId) || [])[0];
  assert.ok(miniature, `Expected miniature target for wargear group ${group.id}`);
  return miniature;
}

export function catalogWithRawDefaultMiniature(datasheetId, miniatureId) {
  const composition = {
    id: `test-default-options:${datasheetId}:${miniatureId}`,
    datasheetId,
    isDefault: true,
  };
  return {
    ...realCatalog,
    compositionById: new Map([
      ...realCatalog.compositionById,
      [composition.id, composition],
    ]),
    compositionMiniaturesByCompositionId: new Map([
      [composition.id, [{
        unitCompositionId: composition.id,
        miniatureId,
        min: 1,
      }]],
    ]),
    baseMiniatureLoadoutsByMiniatureId: new Map(),
    baseMiniatureLoadoutsByDatasheetId: new Map(),
    baseMiniatureLoadoutWargearOptionsByLoadoutId: new Map(),
    loadoutChoiceSetsByDatasheetId: new Map(),
    loadoutChoicesBySetId: new Map(),
    loadoutChoiceItemsByChoiceId: new Map(),
  };
}

export function rawDefaultMiniatureWargear(datasheetId, miniatureId) {
  const catalog = catalogWithRawDefaultMiniature(datasheetId, miniatureId);
  let miniatures = [];
  withCatalog(catalog, () => {
    miniatures = defaultMiniatures(datasheetId, `test-default-options:${datasheetId}:${miniatureId}`);
  });
  assert.equal(miniatures.length, 1, `Expected one synthetic miniature for ${datasheetId}/${miniatureId}`);
  return miniatures[0].wargear || {};
}

export function catalogWithOnlyWargearOption(option) {
  const group = wargearGroupForOption(option);
  return {
    ...realCatalog,
    wargearGroups: [group],
    wargearOptions: [option],
    wargearGroupById: new Map([[group.id, group]]),
    wargearOptionById: new Map([[option.id, option]]),
    wargearGroupsByDatasheetId: new Map([[group.datasheetId, [group]]]),
    wargearOptionsByGroupId: new Map([[group.id, [option]]]),
    loadoutChoiceSetsByDatasheetId: new Map(),
    loadoutChoicesBySetId: new Map(),
    loadoutChoiceItemsByChoiceId: new Map(),
    limitedWargearChoiceSetsByDatasheetId: new Map(),
    limitedWargearChoicesBySetId: new Map(),
    limitedWargearChoiceItemsByChoiceId: new Map(),
    wargearLimitsByLimitedSetId: new Map(),
    allModelWargearChoiceSetsByDatasheetId: new Map(),
    allModelWargearChoicesBySetId: new Map(),
    allModelWargearChoiceItemsByChoiceId: new Map(),
  };
}

export function unitForWargearOptionScope(option, selectAsUnitWargear) {
  const group = wargearGroupForOption(option);
  const miniature = datasheetMiniatureForGroup(group);
  return {
    id: `test-option-scope:${option.id}:${selectAsUnitWargear ? "unit" : "miniature"}`,
    name: realCatalog.datasheetById.get(group.datasheetId)?.name || "Unit",
    datasheetId: group.datasheetId,
    modelCount: 1,
    wargear: selectAsUnitWargear ? { [option.id]: 2 } : {},
    miniatures: [{
      ...miniature,
      id: `test-option-scope-miniature:${option.id}:${miniature.id}`,
      rosterUnitMiniatureId: `test-option-scope-miniature:${option.id}:${miniature.id}`,
      miniatureId: miniature.id,
      name: miniature.name || "Model",
      count: 1,
      wargear: selectAsUnitWargear ? {} : { [option.id]: 2 },
    }],
  };
}

export function validateWargearOptionScope(option, selectAsUnitWargear) {
  const catalog = catalogWithOnlyWargearOption(option);
  const unit = unitForWargearOptionScope(option, selectAsUnitWargear);
  const messages = [];
  let points = 0;
  withCatalog(catalog, () => {
    validateWargearLoadouts([unit], messages);
    points = wargearPoints(unit);
  });
  return { codes: messageCodes(messages), points };
}
