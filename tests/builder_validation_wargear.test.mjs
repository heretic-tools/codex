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

function addNameAliasContext(contexts, { source, datasheetId, miniatureId, wargearItemId }) {
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

function auditedNameAliasContexts() {
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

function countBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    counts[String(row[key])] = (counts[String(row[key])] || 0) + 1;
  }
  return counts;
}

function miniatureBelongsToDatasheet(datasheetId, miniatureId) {
  return (realCatalog.miniaturesByDatasheetId.get(datasheetId) || [])
    .some((miniature) => miniature.id === miniatureId);
}

function catalogWithOnlyLoadoutChoiceSet(set) {
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

function choiceIsRepresented(choice, loadouts) {
  const entries = Object.entries(choice || {});
  return loadouts.some((loadout) => entries.every(([key, count]) => (loadout[key] || 0) >= count));
}

function invalidCountsForLoadout(loadout) {
  return {
    ...loadout,
    "id:not-a-live-loadout-choice": 1,
  };
}

function limitedSetForChoice(choice) {
  const row = realCatalog.limitedWargearChoiceSets.find((set) => set.id === choice.limitedWargearChoiceSetId);
  assert.ok(row, `Expected limited wargear choice set ${choice.limitedWargearChoiceSetId}`);
  return row;
}

function limitedSetForLimit(limit) {
  const row = realCatalog.limitedWargearChoiceSets.find((set) => set.id === limit.limitedWargearChoiceSetId);
  assert.ok(row, `Expected limited wargear limit set ${limit.limitedWargearChoiceSetId}`);
  return row;
}

function limitedChoiceRows(choice) {
  return realCatalog.limitedWargearChoiceItemsByChoiceId.get(choice.id) || [];
}

function firstNonEmptyLimitedChoice(set) {
  const choice = (realCatalog.limitedWargearChoicesBySetId.get(set.id) || [])
    .find((row) => limitedChoiceRows(row).length);
  assert.ok(choice, `Expected non-empty limited choice for set ${set.id}`);
  return choice;
}

function selectionRowsForChoice(choice, repeats) {
  const counts = new Map();
  for (const row of limitedChoiceRows(choice)) {
    counts.set(row.wargearItemId, (counts.get(row.wargearItemId) || 0) + Number(row.count || 0) * repeats);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([wargearItemId, count]) => ({ wargearItemId, count }));
}

function syntheticOptionId(set, wargearItemId) {
  return `test-limited-option:${set.id}:${wargearItemId}`;
}

function syntheticWargearRowsForChoices(set, choices) {
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

function syntheticRegularLoadoutRows(set, selectionRows) {
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

function catalogWithLimitedWargearScenario(set, limit, choice, selectionRows) {
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

function selectedOptionCountsForLimitedScenario(set, selectionRows) {
  return Object.fromEntries(selectionRows.map((row) => [
    syntheticOptionId(set, row.wargearItemId),
    row.count,
  ]));
}

function unitForLimitedWargearScenario(set, limit, selectionRows) {
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

function validateLimitedWargearScenario(set, limit, choice, repeats) {
  const selectionRows = selectionRowsForChoice(choice, repeats);
  const catalog = catalogWithLimitedWargearScenario(set, limit, choice, selectionRows);
  const unit = unitForLimitedWargearScenario(set, limit, selectionRows);
  const messages = [];
  withCatalog(catalog, () => validateWargearLoadouts([unit], messages));
  return messageCodes(messages);
}

function allModelChoiceRows(choice) {
  return realCatalog.allModelWargearChoiceItemsByChoiceId.get(choice.id) || [];
}

function allModelChoicesForSet(set) {
  return realCatalog.allModelWargearChoicesBySetId.get(set.id) || [];
}

function allModelSelectionRows(choiceRepeats) {
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

function syntheticAllModelOptionId(set, wargearItemId) {
  return `test-all-model-option:${set.id}:${wargearItemId}`;
}

function syntheticWargearRowsForAllModelChoices(set, choices) {
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

function catalogWithAllModelWargearScenario(set, selectionRows) {
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

function selectedOptionCountsForAllModelScenario(set, selectionRows) {
  return Object.fromEntries(selectionRows.map((row) => [
    syntheticAllModelOptionId(set, row.wargearItemId),
    row.count,
  ]));
}

function unitForAllModelWargearScenario(set, modelCount, selectionRows) {
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

function validateAllModelWargearScenario(set, choiceRepeats, modelCount) {
  const selectionRows = allModelSelectionRows(choiceRepeats);
  const catalog = catalogWithAllModelWargearScenario(set, selectionRows);
  const unit = unitForAllModelWargearScenario(set, modelCount, selectionRows);
  const messages = [];
  withCatalog(catalog, () => validateWargearLoadouts([unit], messages));
  return messageCodes(messages);
}

function baseLoadoutRows(loadout) {
  return realCatalog.baseMiniatureLoadoutWargearOptionsByLoadoutId.get(loadout.id) || [];
}

function optionMatchesBaseLoadoutScope(loadout, optionId) {
  const option = realCatalog.wargearOptionById.get(optionId);
  const group = option ? realCatalog.wargearGroupById.get(option.wargearOptionGroupId) : null;
  return group?.datasheetId === loadout.datasheetId && group?.miniatureId === loadout.miniatureId;
}

function directBaseLoadoutRows(loadout) {
  return baseLoadoutRows(loadout)
    .filter((row) => optionMatchesBaseLoadoutScope(loadout, row.wargearOptionId));
}

function foreignBaseLoadoutRows(loadout) {
  return baseLoadoutRows(loadout)
    .filter((row) => !optionMatchesBaseLoadoutScope(loadout, row.wargearOptionId));
}

function catalogWithOnlyBaseLoadout(loadout) {
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

function defaultMiniaturesForBaseLoadout(loadout) {
  const catalog = catalogWithOnlyBaseLoadout(loadout);
  let miniatures = [];
  withCatalog(catalog, () => {
    miniatures = defaultMiniatures(loadout.datasheetId, `test-base-composition:${loadout.id}`);
  });
  assert.equal(miniatures.length, 1, `Expected one synthetic miniature for base loadout ${loadout.id}`);
  return miniatures[0];
}

function wargearGroupForOption(option) {
  const group = realCatalog.wargearGroupById.get(option.wargearOptionGroupId);
  assert.ok(group, `Expected wargear group ${option.wargearOptionGroupId}`);
  return group;
}

function datasheetMiniatureForGroup(group) {
  const miniature = group.miniatureId
    ? realCatalog.miniatureById.get(group.miniatureId)
    : (realCatalog.miniaturesByDatasheetId.get(group.datasheetId) || [])[0];
  assert.ok(miniature, `Expected miniature target for wargear group ${group.id}`);
  return miniature;
}

function catalogWithRawDefaultMiniature(datasheetId, miniatureId) {
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

function rawDefaultMiniatureWargear(datasheetId, miniatureId) {
  const catalog = catalogWithRawDefaultMiniature(datasheetId, miniatureId);
  let miniatures = [];
  withCatalog(catalog, () => {
    miniatures = defaultMiniatures(datasheetId, `test-default-options:${datasheetId}:${miniatureId}`);
  });
  assert.equal(miniatures.length, 1, `Expected one synthetic miniature for ${datasheetId}/${miniatureId}`);
  return miniatures[0].wargear || {};
}

function catalogWithOnlyWargearOption(option) {
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

function unitForWargearOptionScope(option, selectAsUnitWargear) {
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

function validateWargearOptionScope(option, selectAsUnitWargear) {
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

test("all live wargear rule tables stay pinned to explicit coverage counts", () => {
  state.catalog = realCatalog;

  assert.equal(realCatalog.wargearItems.length, 3516);
  assert.equal(realCatalog.wargearGroups.length, 3025);
  assert.equal(realCatalog.wargearOptions.length, 6322);
  assert.equal(realCatalog.baseMiniatureLoadouts.length, 1300);
  assert.equal(realCatalog.baseMiniatureLoadoutWargearOptions.length, 3132);
  assert.equal(realCatalog.loadoutChoiceSets.length, 2445);
  assert.equal(realCatalog.loadoutChoices.length, 5374);
  assert.equal(realCatalog.loadoutChoiceWargearItems.length, 8325);
  assert.equal(realCatalog.limitedWargearChoiceSets.length, 343);
  assert.equal(realCatalog.limitedWargearChoices.length, 569);
  assert.equal(realCatalog.limitedWargearChoiceWargearItems.length, 676);
  assert.equal(realCatalog.wargearLimits.length, 492);
  assert.equal(realCatalog.allModelWargearChoiceSets.length, 28);
  assert.equal(realCatalog.allModelWargearChoices.length, 63);
  assert.equal(realCatalog.allModelWargearChoiceWargearItems.length, 69);
  assert.equal(realCatalog.wargearAliases.length, 4);

  assert.equal(realCatalog.wargearGroups.filter((row) => row.miniatureId).length, 3006);
  assert.equal(realCatalog.wargearGroups.filter((row) => !row.miniatureId).length, 19);
  assert.equal(realCatalog.loadoutChoiceSets.filter((row) => row.miniatureId).length, 2426);
  assert.equal(realCatalog.loadoutChoiceSets.filter((row) => !row.miniatureId).length, 19);
  assert.equal(realCatalog.limitedWargearChoiceSets.filter((row) => row.miniatureId).length, 263);
  assert.equal(realCatalog.limitedWargearChoiceSets.filter((row) => !row.miniatureId).length, 80);
  assert.equal(realCatalog.allModelWargearChoiceSets.filter((row) => row.miniatureId).length, 19);
  assert.equal(realCatalog.allModelWargearChoiceSets.filter((row) => !row.miniatureId).length, 9);

  assert.deepEqual(countBy(realCatalog.loadoutChoiceSets, "allowDuplicates"), {
    false: 2399,
    true: 46,
  });
  assert.deepEqual(countBy(realCatalog.loadoutChoiceSets, "alternate"), {
    false: 2440,
    true: 5,
  });
  assert.deepEqual(countBy(realCatalog.loadoutChoiceSets, "limit"), {
    1: 2392,
    2: 45,
    3: 4,
    4: 2,
    6: 2,
  });
  assert.deepEqual(countBy(realCatalog.limitedWargearChoiceSets, "mandatory"), {
    false: 343,
  });
  assert.deepEqual(countBy(realCatalog.allModelWargearChoices, "substitute"), {
    false: 44,
    true: 19,
  });
  assert.deepEqual(countBy(realCatalog.wargearOptions, "inputType"), {
    checkbox: 4406,
    stepper: 1916,
  });
  assert.deepEqual(countBy(realCatalog.wargearGroups, "isStaticWargear"), {
    false: 3025,
  });
  assert.equal(realCatalog.wargearLimits.filter((row) => row.duplicateLimit == null).length, 475);
  assert.equal(realCatalog.wargearLimits.filter((row) => row.duplicateLimit != null).length, 17);
  assert.equal(realCatalog.wargearLimits.filter((row) => row.choiceLimit == null).length, 0);

  const baseLoadoutIds = new Set(realCatalog.baseMiniatureLoadouts.map((row) => row.id));
  const loadoutSetIds = new Set(realCatalog.loadoutChoiceSets.map((row) => row.id));
  const loadoutChoiceIds = new Set(realCatalog.loadoutChoices.map((row) => row.id));
  const limitedSetIds = new Set(realCatalog.limitedWargearChoiceSets.map((row) => row.id));
  const limitedChoiceIds = new Set(realCatalog.limitedWargearChoices.map((row) => row.id));
  const allModelSetIds = new Set(realCatalog.allModelWargearChoiceSets.map((row) => row.id));
  const allModelChoiceIds = new Set(realCatalog.allModelWargearChoices.map((row) => row.id));

  for (const row of realCatalog.wargearGroups) {
    assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing wargear group datasheet ${row.datasheetId}`);
    if (row.miniatureId) {
      assert.ok(realCatalog.miniatureById.has(row.miniatureId), `Missing wargear group miniature ${row.miniatureId}`);
      assert.ok(miniatureBelongsToDatasheet(row.datasheetId, row.miniatureId), `Wargear group miniature ${row.miniatureId} is outside datasheet ${row.datasheetId}`);
    }
  }
  for (const row of realCatalog.wargearOptions) {
    assert.ok(realCatalog.wargearGroupById.has(row.wargearOptionGroupId), `Missing wargear option group ${row.wargearOptionGroupId}`);
    assert.ok(realCatalog.wargearItemById.has(row.wargearItemId), `Missing wargear option item ${row.wargearItemId}`);
  }
  for (const row of realCatalog.baseMiniatureLoadouts) {
    assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing base loadout datasheet ${row.datasheetId}`);
    assert.ok(realCatalog.miniatureById.has(row.miniatureId), `Missing base loadout miniature ${row.miniatureId}`);
    assert.ok(miniatureBelongsToDatasheet(row.datasheetId, row.miniatureId), `Base loadout miniature ${row.miniatureId} is outside datasheet ${row.datasheetId}`);
  }
  for (const row of realCatalog.baseMiniatureLoadoutWargearOptions) {
    assert.ok(baseLoadoutIds.has(row.baseMiniatureLoadoutId), `Missing base loadout ${row.baseMiniatureLoadoutId}`);
    assert.ok(realCatalog.wargearOptionById.has(row.wargearOptionId), `Missing base loadout option ${row.wargearOptionId}`);
  }
  for (const row of realCatalog.loadoutChoiceSets) {
    assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing loadout set datasheet ${row.datasheetId}`);
    if (row.miniatureId) {
      assert.ok(realCatalog.miniatureById.has(row.miniatureId), `Missing loadout set miniature ${row.miniatureId}`);
      assert.ok(miniatureBelongsToDatasheet(row.datasheetId, row.miniatureId), `Loadout set miniature ${row.miniatureId} is outside datasheet ${row.datasheetId}`);
    }
  }
  for (const row of realCatalog.loadoutChoices) {
    assert.ok(loadoutSetIds.has(row.loadoutChoiceSetId), `Missing loadout choice set ${row.loadoutChoiceSetId}`);
  }
  for (const row of realCatalog.loadoutChoiceWargearItems) {
    assert.ok(loadoutChoiceIds.has(row.loadoutChoiceId), `Missing loadout choice ${row.loadoutChoiceId}`);
    assert.ok(realCatalog.wargearItemById.has(row.wargearItemId), `Missing loadout choice item ${row.wargearItemId}`);
  }
  for (const row of realCatalog.limitedWargearChoiceSets) {
    assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing limited set datasheet ${row.datasheetId}`);
    if (row.miniatureId) {
      assert.ok(realCatalog.miniatureById.has(row.miniatureId), `Missing limited set miniature ${row.miniatureId}`);
      assert.ok(miniatureBelongsToDatasheet(row.datasheetId, row.miniatureId), `Limited set miniature ${row.miniatureId} is outside datasheet ${row.datasheetId}`);
    }
  }
  for (const row of realCatalog.limitedWargearChoices) {
    assert.ok(limitedSetIds.has(row.limitedWargearChoiceSetId), `Missing limited choice set ${row.limitedWargearChoiceSetId}`);
  }
  for (const row of realCatalog.limitedWargearChoiceWargearItems) {
    assert.ok(limitedChoiceIds.has(row.limitedWargearChoiceId), `Missing limited choice ${row.limitedWargearChoiceId}`);
    assert.ok(realCatalog.wargearItemById.has(row.wargearItemId), `Missing limited choice item ${row.wargearItemId}`);
  }
  for (const row of realCatalog.wargearLimits) {
    assert.ok(limitedSetIds.has(row.limitedWargearChoiceSetId), `Missing wargear limit set ${row.limitedWargearChoiceSetId}`);
  }
  for (const row of realCatalog.allModelWargearChoiceSets) {
    assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing all-model set datasheet ${row.datasheetId}`);
    if (row.miniatureId) {
      assert.ok(realCatalog.miniatureById.has(row.miniatureId), `Missing all-model set miniature ${row.miniatureId}`);
      assert.ok(miniatureBelongsToDatasheet(row.datasheetId, row.miniatureId), `All-model set miniature ${row.miniatureId} is outside datasheet ${row.datasheetId}`);
    }
  }
  for (const row of realCatalog.allModelWargearChoices) {
    assert.ok(allModelSetIds.has(row.allModelWargearChoiceSetId), `Missing all-model choice set ${row.allModelWargearChoiceSetId}`);
  }
  for (const row of realCatalog.allModelWargearChoiceWargearItems) {
    assert.ok(allModelChoiceIds.has(row.allModelWargearChoiceId), `Missing all-model choice ${row.allModelWargearChoiceId}`);
    assert.ok(realCatalog.wargearItemById.has(row.wargearItemId), `Missing all-model choice item ${row.wargearItemId}`);
  }
  for (const row of realCatalog.wargearAliases) {
    assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing wargear alias datasheet ${row.datasheetId}`);
    if (row.miniatureId) {
      assert.ok(realCatalog.miniatureById.has(row.miniatureId), `Missing wargear alias miniature ${row.miniatureId}`);
    }
    assert.ok(realCatalog.wargearItemById.has(row.wargearItemId), `Missing wargear alias item ${row.wargearItemId}`);
    assert.ok(String(row.key || "").startsWith("name:"), `Unexpected wargear alias key ${row.key}`);
  }
});

test("all live wargear options generate scoped default selections", () => {
  state.catalog = realCatalog;
  const unitGroups = realCatalog.wargearGroups.filter((group) => !group.miniatureId);
  const miniatureGroups = realCatalog.wargearGroups.filter((group) => group.miniatureId);
  const unitOptions = realCatalog.wargearOptions.filter((option) => !wargearGroupForOption(option).miniatureId);
  const miniatureOptions = realCatalog.wargearOptions.filter((option) => wargearGroupForOption(option).miniatureId);
  let unitDefaultRows = 0;
  let unitZeroDefaultRows = 0;
  let miniatureDefaultRows = 0;
  let miniatureZeroDefaultRows = 0;
  let unitDefaultTotal = 0;
  let miniatureDefaultTotal = 0;
  const unitDatasheetIds = new Set(unitGroups.map((group) => group.datasheetId));
  const miniaturePairs = new Map();

  assert.equal(unitGroups.length, 19);
  assert.equal(miniatureGroups.length, 3006);
  assert.equal(unitOptions.length, 21);
  assert.equal(miniatureOptions.length, 6301);
  assert.equal(unitOptions.filter((option) => Number(option.defaultValue || 0) > 0).length, 5);
  assert.equal(miniatureOptions.filter((option) => Number(option.defaultValue || 0) > 0).length, 3690);
  assert.equal(unitOptions.filter((option) => Number(option.defaultValue || 0) === 0).length, 16);
  assert.equal(miniatureOptions.filter((option) => Number(option.defaultValue || 0) === 0).length, 2611);

  for (const datasheetId of unitDatasheetIds) {
    const selected = defaultWargear(datasheetId);
    for (const group of unitGroups.filter((row) => row.datasheetId === datasheetId)) {
      for (const option of realCatalog.wargearOptionsByGroupId.get(group.id) || []) {
        const defaultValue = Number(option.defaultValue || 0);
        if (defaultValue > 0) {
          assert.equal(
            selected[option.id],
            defaultValue,
            `Expected unit default option ${option.id} to be selected`
          );
          unitDefaultRows += 1;
          unitDefaultTotal += defaultValue;
        } else {
          assert.ok(!(option.id in selected), `Expected zero unit default option ${option.id} to stay unselected`);
          unitZeroDefaultRows += 1;
        }
      }
    }
  }

  for (const group of miniatureGroups) {
    const key = `${group.datasheetId}|${group.miniatureId}`;
    if (!miniaturePairs.has(key)) {
      miniaturePairs.set(key, { datasheetId: group.datasheetId, miniatureId: group.miniatureId, groups: [] });
    }
    miniaturePairs.get(key).groups.push(group);
  }

  for (const pair of miniaturePairs.values()) {
    const selected = rawDefaultMiniatureWargear(pair.datasheetId, pair.miniatureId);
    for (const group of pair.groups) {
      for (const option of realCatalog.wargearOptionsByGroupId.get(group.id) || []) {
        const defaultValue = Number(option.defaultValue || 0);
        if (defaultValue > 0) {
          assert.equal(
            selected[option.id],
            defaultValue,
            `Expected miniature default option ${option.id} to be selected`
          );
          miniatureDefaultRows += 1;
          miniatureDefaultTotal += defaultValue;
        } else {
          assert.ok(!(option.id in selected), `Expected zero miniature default option ${option.id} to stay unselected`);
          miniatureZeroDefaultRows += 1;
        }
      }
    }
  }

  assert.equal(unitDatasheetIds.size, 18);
  assert.equal(miniaturePairs.size, 1560);
  assert.equal(unitDefaultRows, 5);
  assert.equal(unitZeroDefaultRows, 16);
  assert.equal(miniatureDefaultRows, 3690);
  assert.equal(miniatureZeroDefaultRows, 2611);
  assert.equal(unitDefaultTotal, 5);
  assert.equal(miniatureDefaultTotal, 6821);
});

test("all live wargear options validate target scope and selected points", () => {
  state.catalog = realCatalog;
  let validUnitScopeRows = 0;
  let validMiniatureScopeRows = 0;
  let invalidUnitScopeRows = 0;
  let invalidMiniatureScopeRows = 0;
  let paidOptionRows = 0;
  let selectedPointsTotal = 0;

  assert.equal(realCatalog.wargearOptions.length, 6322);
  assert.equal(realCatalog.wargearOptions.filter((option) => Number(option.points || 0) > 0).length, 83);

  for (const option of realCatalog.wargearOptions) {
    const group = wargearGroupForOption(option);
    const correct = validateWargearOptionScope(option, !group.miniatureId);
    assert.ok(
      !correct.codes.includes("wargear_loadout.invalid_unit_wargear"),
      `Expected option ${option.id} not to be invalid as unit wargear in its valid scope`
    );
    assert.ok(
      !correct.codes.includes("wargear_loadout.invalid_model_wargear"),
      `Expected option ${option.id} not to be invalid as model wargear in its valid scope`
    );
    assert.equal(correct.points, Number(option.points || 0) * 2);
    selectedPointsTotal += correct.points;
    if (Number(option.points || 0) > 0) {
      paidOptionRows += 1;
    }

    if (group.miniatureId) {
      validMiniatureScopeRows += 1;
      const wrong = validateWargearOptionScope(option, true);
      assert.ok(
        wrong.codes.includes("wargear_loadout.invalid_unit_wargear"),
        `Expected miniature option ${option.id} to be invalid as unit wargear`
      );
      invalidUnitScopeRows += 1;
    } else {
      validUnitScopeRows += 1;
      const wrong = validateWargearOptionScope(option, false);
      assert.ok(
        wrong.codes.includes("wargear_loadout.invalid_model_wargear"),
        `Expected unit option ${option.id} to be invalid as model wargear`
      );
      invalidMiniatureScopeRows += 1;
    }
  }

  assert.equal(validUnitScopeRows, 21);
  assert.equal(validMiniatureScopeRows, 6301);
  assert.equal(invalidUnitScopeRows, 6301);
  assert.equal(invalidMiniatureScopeRows, 21);
  assert.equal(paidOptionRows, 83);
  assert.equal(selectedPointsTotal, 1492);
});

test("all live base miniature loadout rows generate scoped default wargear", () => {
  state.catalog = realCatalog;
  const loadouts = realCatalog.baseMiniatureLoadouts;
  const rows = realCatalog.baseMiniatureLoadoutWargearOptions;
  let emptyLoadouts = 0;
  let directRows = 0;
  let foreignRows = 0;
  let foreignLoadouts = 0;

  assert.equal(loadouts.length, 1300);
  assert.equal(rows.length, 3132);
  assert.equal(loadouts.filter((loadout) => loadout.miniatureId).length, 1300);
  assert.equal(loadouts.filter((loadout) => !loadout.miniatureId).length, 0);
  assert.equal(rows.filter((row) => Number(row.count || 0) <= 0).length, 0);

  for (const loadout of loadouts) {
    const miniature = defaultMiniaturesForBaseLoadout(loadout);
    const direct = directBaseLoadoutRows(loadout);
    const foreign = foreignBaseLoadoutRows(loadout);

    if (!baseLoadoutRows(loadout).length) {
      emptyLoadouts += 1;
    }
    if (foreign.length) {
      foreignLoadouts += 1;
    }

    assert.equal(miniature.miniatureId, loadout.miniatureId);
    assert.equal(miniature.count, 2);

    for (const row of direct) {
      assert.equal(
        miniature.wargear[row.wargearOptionId],
        Number(row.count || 0) * 2,
        `Expected base loadout ${loadout.id} to apply scoped option ${row.wargearOptionId}`
      );
      directRows += 1;
    }

    for (const row of foreign) {
      assert.ok(
        !(row.wargearOptionId in (miniature.wargear || {})),
        `Expected base loadout ${loadout.id} not to leak foreign option ${row.wargearOptionId}`
      );
      foreignRows += 1;
    }
  }

  assert.equal(emptyLoadouts, 2);
  assert.equal(directRows, 3115);
  assert.equal(foreignRows, 17);
  assert.equal(foreignLoadouts, 8);
});

test("all live regular loadout choice sets generate valid and invalid coverage", () => {
  state.catalog = realCatalog;
  const sets = realCatalog.loadoutChoiceSets;
  const emptyChoices = realCatalog.loadoutChoices.filter((choice) => (
    !(realCatalog.loadoutChoiceItemsByChoiceId.get(choice.id) || []).length
  ));
  let generatedLoadoutCount = 0;

  assert.equal(sets.length, 2445);
  assert.equal(realCatalog.loadoutChoices.length, 5374);
  assert.equal(realCatalog.loadoutChoiceWargearItems.length, 8325);
  assert.equal(emptyChoices.length, 338);
  assert.equal(sets.filter((set) => set.allowDuplicates).length, 46);
  assert.equal(sets.filter((set) => set.alternate).length, 5);

  for (const row of sets) {
    const sourceChoices = realCatalog.loadoutChoicesBySetId.get(row.id) || [];
    withCatalog(catalogWithOnlyLoadoutChoiceSet(row), () => {
      const normalized = loadoutChoiceSets(row.datasheetId, row.miniatureId || null)
        .find((set) => set.id === row.id);
      assert.ok(normalized, `Expected normalized loadout set ${row.id}`);
      assert.equal(normalized.choices.length, sourceChoices.length, `Choice count mismatch for loadout set ${row.id}`);

      const validLoadouts = validLoadoutsFromChoiceSets([normalized]);
      generatedLoadoutCount += validLoadouts.length;
      assert.ok(validLoadouts.length, `Expected valid loadouts for set ${row.id}`);

      for (const choice of normalized.choices) {
        assert.ok(
          choiceIsRepresented(choice, validLoadouts),
          `Expected choice in set ${row.id} to be represented by at least one generated loadout`
        );
      }

      const validLoadout = validLoadouts[0];
      assert.ok(
        wargearLoadoutMatchesChoiceSets(row.datasheetId, row.miniatureId || null, validLoadout, 1),
        `Expected generated loadout for set ${row.id} to validate for one model`
      );
      assert.ok(
        wargearLoadoutMatchesChoiceSets(row.datasheetId, row.miniatureId || null, addCounts(validLoadout, validLoadout), 2),
        `Expected generated loadout for set ${row.id} to partition across two models`
      );
      assert.ok(
        !wargearLoadoutMatchesChoiceSets(row.datasheetId, row.miniatureId || null, invalidCountsForLoadout(validLoadout), 1),
        `Expected impossible loadout for set ${row.id} to be rejected`
      );
    });
  }

  assert.equal(generatedLoadoutCount, 6209);
});

test("all live limited wargear choices and limits accept valid selections and reject over-limit selections", () => {
  state.catalog = realCatalog;
  const sets = realCatalog.limitedWargearChoiceSets;
  const choices = realCatalog.limitedWargearChoices;
  const limits = realCatalog.wargearLimits;
  const choicesWithItems = choices.filter((choice) => limitedChoiceRows(choice).length);
  const emptyChoices = choices.filter((choice) => !limitedChoiceRows(choice).length);
  let acceptedChoiceRows = 0;
  let disabledChoiceRows = 0;
  let validLimitRows = 0;
  let invalidLimitRows = 0;

  assert.equal(sets.length, 343);
  assert.equal(choices.length, 569);
  assert.equal(realCatalog.limitedWargearChoiceWargearItems.length, 676);
  assert.equal(limits.length, 492);
  assert.equal(choicesWithItems.length, 567);
  assert.equal(emptyChoices.length, 2);
  assert.equal(sets.filter((set) => set.miniatureId).length, 263);
  assert.equal(sets.filter((set) => !set.miniatureId).length, 80);
  assert.equal(limits.filter((limit) => Number(limit.choiceLimit || 0) === 0).length, 3);
  assert.equal(limits.filter((limit) => limit.duplicateLimit != null).length, 17);

  for (const choice of choicesWithItems) {
    const set = limitedSetForChoice(choice);
    const setLimits = [...(realCatalog.wargearLimitsByLimitedSetId.get(set.id) || [])]
      .sort((left, right) => Number(left.modelCount || 0) - Number(right.modelCount || 0));
    const acceptingLimit = setLimits.find((limit) => Number(limit.choiceLimit || 0) > 0);
    const limit = acceptingLimit || setLimits[0];
    assert.ok(limit, `Expected wargear limit for limited set ${set.id}`);

    const codes = validateLimitedWargearScenario(set, limit, choice, 1);
    if (acceptingLimit) {
      assert.deepEqual(codes, [], `Expected limited choice ${choice.id} to be accepted`);
      acceptedChoiceRows += 1;
    } else {
      assert.deepEqual(
        codes,
        ["wargear_loadout.invalid_wargear_requirement"],
        `Expected disabled limited choice ${choice.id} to be rejected`
      );
      disabledChoiceRows += 1;
    }
  }

  for (const limit of limits) {
    const set = limitedSetForLimit(limit);
    const choice = firstNonEmptyLimitedChoice(set);
    const choiceLimit = Number(limit.choiceLimit || 0);
    const duplicateLimit = limit.duplicateLimit == null
      ? choiceLimit
      : Math.min(choiceLimit, Number(limit.duplicateLimit || 0));
    const validRepeats = choiceLimit > 0 ? 1 : 0;
    const invalidRepeats = duplicateLimit + 1;

    assert.deepEqual(
      validateLimitedWargearScenario(set, limit, choice, validRepeats),
      [],
      `Expected limited rule ${set.id}/${limit.modelCount} to accept valid selections`
    );
    validLimitRows += 1;

    assert.deepEqual(
      validateLimitedWargearScenario(set, limit, choice, invalidRepeats),
      ["wargear_loadout.invalid_wargear_requirement"],
      `Expected limited rule ${set.id}/${limit.modelCount} to reject over-limit selections`
    );
    invalidLimitRows += 1;
  }

  assert.equal(acceptedChoiceRows, 541);
  assert.equal(disabledChoiceRows, 26);
  assert.equal(validLimitRows, 492);
  assert.equal(invalidLimitRows, 492);
});

test("all live all-model wargear choices and sets accept complete selections and reject incomplete selections", () => {
  state.catalog = realCatalog;
  const sets = realCatalog.allModelWargearChoiceSets;
  const choices = realCatalog.allModelWargearChoices;
  const baseChoices = choices.filter((choice) => !choice.substitute);
  const substituteChoices = choices.filter((choice) => choice.substitute);
  let acceptedBaseRows = 0;
  let acceptedSubstituteRows = 0;
  let acceptedStandaloneSubstituteRows = 0;
  let underfilledSetRows = 0;
  let baseConflictSetRows = 0;
  let missingBaseSubstituteRows = 0;

  assert.equal(sets.length, 28);
  assert.equal(choices.length, 63);
  assert.equal(realCatalog.allModelWargearChoiceWargearItems.length, 69);
  assert.equal(baseChoices.length, 44);
  assert.equal(substituteChoices.length, 19);
  assert.equal(sets.filter((set) => set.miniatureId).length, 19);
  assert.equal(sets.filter((set) => !set.miniatureId).length, 9);
  assert.equal(sets.filter((set) => allModelChoicesForSet(set).some((choice) => !choice.substitute)).length, 27);
  assert.equal(sets.filter((set) => allModelChoicesForSet(set).filter((choice) => !choice.substitute).length >= 2).length, 16);
  assert.equal(sets.filter((set) => allModelChoicesForSet(set).every((choice) => choice.substitute)).length, 1);

  for (const set of sets) {
    const setChoices = allModelChoicesForSet(set);
    const setBaseChoices = setChoices.filter((choice) => !choice.substitute);
    const setSubstituteChoices = setChoices.filter((choice) => choice.substitute);

    for (const choice of setBaseChoices) {
      assert.deepEqual(
        validateAllModelWargearScenario(set, [[choice, 2]], 2),
        [],
        `Expected all-model base choice ${choice.id} to cover two models`
      );
      acceptedBaseRows += 1;
    }

    if (setBaseChoices.length) {
      assert.deepEqual(
        validateAllModelWargearScenario(set, [[setBaseChoices[0], 1]], 2),
        ["wargear_loadout.invalid_wargear_requirement"],
        `Expected all-model set ${set.id} to reject underfilled base selections`
      );
      underfilledSetRows += 1;
    }

    if (setBaseChoices.length >= 2) {
      assert.deepEqual(
        validateAllModelWargearScenario(set, [[setBaseChoices[0], 1], [setBaseChoices[1], 1]], 2),
        ["wargear_loadout.invalid_wargear_requirement"],
        `Expected all-model set ${set.id} to reject mixed base selections`
      );
      baseConflictSetRows += 1;
    }

    for (const choice of setSubstituteChoices) {
      if (setBaseChoices.length) {
        assert.deepEqual(
          validateAllModelWargearScenario(set, [[setBaseChoices[0], 1], [choice, 1]], 2),
          [],
          `Expected all-model substitute choice ${choice.id} to be accepted with an active base`
        );
        acceptedSubstituteRows += 1;

        assert.deepEqual(
          validateAllModelWargearScenario(set, [[choice, 1]], 1),
          ["wargear_loadout.invalid_wargear_requirement"],
          `Expected all-model substitute choice ${choice.id} to require an active base`
        );
        missingBaseSubstituteRows += 1;
      } else {
        assert.deepEqual(
          validateAllModelWargearScenario(set, [[choice, 1]], 1),
          [],
          `Expected standalone all-model substitute choice ${choice.id} to remain accepted`
        );
        acceptedStandaloneSubstituteRows += 1;
      }
    }
  }

  assert.equal(acceptedBaseRows, 44);
  assert.equal(acceptedSubstituteRows, 16);
  assert.equal(acceptedStandaloneSubstituteRows, 3);
  assert.equal(underfilledSetRows, 27);
  assert.equal(baseConflictSetRows, 16);
  assert.equal(missingBaseSubstituteRows, 16);
});

test("canonical wargear keys use item IDs except confirmed same-context duplicate bridges", () => {
  state.catalog = realCatalog;

  const termagants = datasheetNamed("Termagants");
  const termagant = miniatureNamedForDatasheet("Termagants", "Termagant");
  const fleshborerOption = realCatalog.wargearOptionById.get(
    optionIdForMiniatureItem(termagants.id, termagant.id, "Fleshborer")
  );
  const fleshborerKey = canonicalWargearKey(fleshborerOption.wargearItemId, {
    datasheetId: termagants.id,
    miniatureId: termagant.id,
  });
  assert.match(fleshborerKey, /^id:/);

  const beserks = datasheetNamed("Cthonian Beserks");
  const beserk = miniatureNamedForDatasheet("Cthonian Beserks", "Cthonian Beserk");
  const plasmaAxeOption = realCatalog.wargearOptionById.get(
    optionIdForMiniatureItem(beserks.id, beserk.id, "Heavy plasma axe")
  );
  const allModelSet = realCatalog.allModelWargearChoiceSets.find((row) => (
    row.datasheetId === beserks.id && row.miniatureId === beserk.id
  ));
  assert.ok(allModelSet, "Expected Cthonian Beserks all-model choice set");
  const allModelChoiceIds = (realCatalog.allModelWargearChoicesBySetId.get(allModelSet.id) || [])
    .map((row) => row.id);
  const plasmaAxeChoiceItem = allModelChoiceIds
    .flatMap((choiceId) => realCatalog.allModelWargearChoiceItemsByChoiceId.get(choiceId) || [])
    .find((row) => realCatalog.wargearItemById.get(row.wargearItemId)?.name === "Heavy plasma axe");
  assert.ok(plasmaAxeChoiceItem, "Expected Cthonian Beserks Heavy plasma axe all-model choice item");

  const context = { datasheetId: beserks.id, miniatureId: beserk.id };
  const optionKey = canonicalWargearKey(plasmaAxeOption.wargearItemId, context);
  const choiceKey = canonicalWargearKey(plasmaAxeChoiceItem.wargearItemId, context);
  assert.equal(optionKey, "name:heavy plasma axe");
  assert.equal(choiceKey, optionKey);
});

test("canonical name aliases are limited to audited duplicate-name bridges", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.wargearAliases.length, 4);
  assert.deepEqual(auditedNameAliasContexts(), [
    {
      datasheet: "’Ardmob Boyz",
      miniature: "Boss Nob",
      key: "name:big choppa",
      itemIds: 2,
      sources: ["loadout", "option"],
    },
    {
      datasheet: "Cthonian Beserks",
      miniature: "Cthonian Beserk",
      key: "name:heavy plasma axe",
      itemIds: 2,
      sources: ["all_model", "loadout", "option"],
    },
  ]);
});

test("Cthonian Beserks duplicate-name Heavy plasma axe all-model rule stays valid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Cthonian Beserks");
  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("’Ardmob Boyz duplicate-name Big Choppa loadout bridge stays valid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("’Ardmob Boyz");
  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("Cthonian Beserks mixed base all-model weapons are invalid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Cthonian Beserks");
  const beserk = miniatureInUnit(unit, "Cthonian Beserk");
  setMiniatureWargear(unit, beserk, {
    "Heavy plasma axe": 4,
    "Concussion maul": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("Eliminator Sergeant substitute weapon does not break all-model matching", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Eliminator Squad");
  const sergeant = miniatureInUnit(unit, "Eliminator Sergeant");
  setMiniatureWargear(unit, sergeant, {
    "Close combat weapon": 1,
    "Bolt pistol": 1,
    "Instigator bolt carbine": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("Eliminator non-sergeant mixed all-model weapons are invalid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Eliminator Squad");
  const eliminator = miniatureInUnit(unit, "Eliminator");
  setMiniatureWargear(unit, eliminator, {
    "Close combat weapon": 2,
    "Bolt pistol": 2,
    "Bolt sniper rifle": 1,
    "Las fusil": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("all-model substitute choices require an active base choice", () => {
  state.catalog = realCatalog;
  const macrocytes = defaultWargearUnit("Canoptek Macrocytes");
  const macrocyte = miniatureInUnit(macrocytes, "Canoptek Macrocytes");
  setMiniatureWargear(macrocytes, macrocyte, {
    Claws: 5,
    "Accelerator Mandible": 5,
  });

  const invalidMessages = [];
  validateWargearLoadouts([macrocytes], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const yaegirs = defaultWargearUnit("Hernkyn Yaegirs");
  const yaegir = miniatureInUnit(yaegirs, "Hernkyn Yaegir");
  setMiniatureWargear(yaegirs, yaegir, {
    "Close combat weapon": 9,
    "Bolt shotgun": 8,
    "APM launcher": 1,
  });

  const validMessages = [];
  validateWargearLoadouts([yaegirs], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("all-model substitutes are anchored to their own substitute family", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Einhyr Hearthguard");
  const hesyr = miniatureInUnit(unit, "Hesyr");
  const hearthguard = miniatureInUnit(unit, "Einhyr Hearthguard");
  setMiniatureWargear(unit, hesyr, {
    "EtaCarn plasma gun": 1,
    "Weavefield crest": 1,
    "Exoarmour grenade launcher": 1,
    "Graviton hammer": 1,
  });
  setMiniatureWargear(unit, hearthguard, {
    "EtaCarn plasma gun": 4,
    "Exoarmour grenade launcher": 4,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("alternate loadout choices replace regular loadout sets", () => {
  state.catalog = realCatalog;
  const validUnit = defaultWargearUnit("Chaos Terminator Squad");
  const validChampion = miniatureInUnit(validUnit, "Terminator Champion");
  setMiniatureWargear(validUnit, validChampion, {
    "Paired accursed weapons": 1,
  });

  const validMessages = [];
  validateWargearLoadouts([validUnit], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const invalidUnit = defaultWargearUnit("Chaos Terminator Squad");
  const invalidChampion = miniatureInUnit(invalidUnit, "Terminator Champion");
  setMiniatureWargear(invalidUnit, invalidChampion, {
    "Combi-bolter": 1,
    "Paired accursed weapons": 1,
  });

  const invalidMessages = [];
  validateWargearLoadouts([invalidUnit], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("duplicate-allowed loadout sets can repeat one option up to the set limit", () => {
  state.catalog = realCatalog;
  const validUnit = defaultWargearUnit("Deff Dread");
  const validDread = miniatureInUnit(validUnit, "Deff Dread");
  setMiniatureWargear(validUnit, validDread, {
    "Stompy feet": 1,
    "Dread klaw": 4,
  });

  const validMessages = [];
  validateWargearLoadouts([validUnit], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));

  const invalidUnit = defaultWargearUnit("Deff Dread");
  const invalidDread = miniatureInUnit(invalidUnit, "Deff Dread");
  setMiniatureWargear(invalidUnit, invalidDread, {
    "Stompy feet": 1,
    "Dread klaw": 5,
  });

  const invalidMessages = [];
  validateWargearLoadouts([invalidUnit], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("unit-scoped limited wargear counts selections across model rows", () => {
  state.catalog = realCatalog;
  const validUnit = defaultWargearUnit("Intercessor Squad");
  const validIntercessors = miniatureInUnit(validUnit, "Intercessor");
  setMiniatureWargear(validUnit, validIntercessors, {
    "Bolt pistol": 4,
    "Bolt rifle": 4,
    "Close combat weapon": 4,
    "Astartes grenade launcher": 1,
  });

  const validMessages = [];
  validateWargearLoadouts([validUnit], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));

  const invalidUnit = defaultWargearUnit("Intercessor Squad");
  const invalidIntercessors = miniatureInUnit(invalidUnit, "Intercessor");
  setMiniatureWargear(invalidUnit, invalidIntercessors, {
    "Bolt pistol": 4,
    "Bolt rifle": 4,
    "Close combat weapon": 4,
    "Astartes grenade launcher": 2,
  });

  const invalidMessages = [];
  validateWargearLoadouts([invalidUnit], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(invalidMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("unit-scoped all-model choices reject mixed base selections across model rows", () => {
  state.catalog = realCatalog;
  const validUnit = defaultWargearUnit("Inceptor Squad");
  const validSergeant = miniatureInUnit(validUnit, "Inceptor Sergeant");
  const validInceptors = miniatureInUnit(validUnit, "Inceptor");
  setMiniatureWargear(validUnit, validSergeant, {
    "Close combat weapon": 1,
    "Plasma exterminators": 1,
  });
  setMiniatureWargear(validUnit, validInceptors, {
    "Close combat weapon": 2,
    "Plasma exterminators": 2,
  });

  const validMessages = [];
  validateWargearLoadouts([validUnit], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));

  const invalidUnit = defaultWargearUnit("Inceptor Squad");
  const invalidSergeant = miniatureInUnit(invalidUnit, "Inceptor Sergeant");
  const invalidInceptors = miniatureInUnit(invalidUnit, "Inceptor");
  setMiniatureWargear(invalidUnit, invalidSergeant, {
    "Close combat weapon": 1,
    "Assault bolters": 1,
  });
  setMiniatureWargear(invalidUnit, invalidInceptors, {
    "Close combat weapon": 2,
    "Plasma exterminators": 2,
  });

  const invalidMessages = [];
  validateWargearLoadouts([invalidUnit], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("Termagant limited wargear thresholds scale with model count", () => {
  state.catalog = realCatalog;
  const tenTermagants = defaultWargearUnit("Termagants");
  const tenModels = miniatureInUnit(tenTermagants, "Termagant");
  setMiniatureWargear(tenTermagants, tenModels, {
    "Chitinous claws and teeth": 10,
    "Fleshborer": 8,
    "Strangleweb": 2,
  });

  const invalidMessages = [];
  validateWargearLoadouts([tenTermagants], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const twentyTermagants = defaultWargearUnit("Termagants");
  const twentyModels = miniatureInUnit(twentyTermagants, "Termagant");
  twentyModels.count = 20;
  twentyTermagants.modelCount = 20;
  setMiniatureWargear(twentyTermagants, twentyModels, {
    "Chitinous claws and teeth": 20,
    "Fleshborer": 18,
    "Strangleweb": 2,
  });

  const validMessages = [];
  validateWargearLoadouts([twentyTermagants], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("limited wargear thresholds use total unit model count and duplicate caps", () => {
  state.catalog = realCatalog;
  const validShockTroops = defaultWargearUnit("Cadian Shock Troops");
  const validTrooper = miniatureInUnit(validShockTroops, "Shock Trooper");
  const validSergeant = miniatureInUnit(validShockTroops, "Shock Trooper Sergeant");
  validTrooper.count = 18;
  validSergeant.count = 2;
  validShockTroops.modelCount = 20;
  setMiniatureWargear(validShockTroops, validTrooper, {
    "Close combat weapon": 18,
    Lasgun: 14,
    Flamer: 1,
    "Grenade launcher": 1,
    Meltagun: 1,
    "Plasma gun": 1,
  });
  setMiniatureWargear(validShockTroops, validSergeant, {
    Chainsword: 2,
    Laspistol: 2,
  });

  const validMessages = [];
  validateWargearLoadouts([validShockTroops], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));

  const duplicateShockTroops = defaultWargearUnit("Cadian Shock Troops");
  const duplicateTrooper = miniatureInUnit(duplicateShockTroops, "Shock Trooper");
  const duplicateSergeant = miniatureInUnit(duplicateShockTroops, "Shock Trooper Sergeant");
  duplicateTrooper.count = 18;
  duplicateSergeant.count = 2;
  duplicateShockTroops.modelCount = 20;
  setMiniatureWargear(duplicateShockTroops, duplicateTrooper, {
    "Close combat weapon": 18,
    Lasgun: 14,
    Flamer: 1,
    "Plasma gun": 3,
  });
  setMiniatureWargear(duplicateShockTroops, duplicateSergeant, {
    Chainsword: 2,
    Laspistol: 2,
  });

  const duplicateMessages = [];
  validateWargearLoadouts([duplicateShockTroops], duplicateMessages);
  assert.ok(messageCodes(duplicateMessages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("limited wargear choices with overlapping combo rows use exact cover", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Battle Sisters Squad");
  const battleSister = miniatureInUnit(unit, "Battle Sister");
  setMiniatureWargear(unit, battleSister, {
    "Bolt pistol": 9,
    "Close combat weapon": 9,
    Boltgun: 7,
    "Heavy bolter": 1,
    "Ministorum flamer": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("limited choices with base wargear do not invalidate default loadouts", () => {
  state.catalog = realCatalog;
  const pathfinders = defaultWargearUnit("Pathfinder Team");

  const pathfinderMessages = [];
  validateWargearLoadouts([pathfinders], pathfinderMessages);
  assert.ok(!messageCodes(pathfinderMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const tankbustas = defaultWargearUnit("Tankbustas");
  const tankbustaMessages = [];
  validateWargearLoadouts([tankbustas], tankbustaMessages);
  assert.ok(!messageCodes(tankbustaMessages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("default-only limited choices still count toward limited caps", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Hyperadapted Raveners");
  const raveners = miniatureInUnit(unit, "Raveners");
  setMiniatureWargear(unit, raveners, {
    "Ravener heavy claws and talons": 4,
    "Venom bolt": 2,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("zero-count miniatures cannot keep selected wargear", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Termagants");
  const termagant = miniatureInUnit(unit, "Termagant");
  termagant.count = 0;
  unit.modelCount = 0;
  setMiniatureWargear(unit, termagant, {
    "Chitinous claws and teeth": 1,
    "Fleshborer": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(messageCodes(messages).includes("wargear_loadout.zero_count_model_wargear"));
});

test("default zero-count miniatures start without selected wargear", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Fortis Kill Team");
  const zeroCountMiniatures = unit.miniatures.filter((miniature) => miniature.count === 0);
  assert.ok(zeroCountMiniatures.length, "Expected a default optional miniature in Fortis Kill Team");
  assert.ok(zeroCountMiniatures.every((miniature) => !Object.keys(miniature.wargear || {}).length));

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.zero_count_model_wargear"));
});

test("default catalog wargear loadouts do not self-validate as invalid", () => {
  state.catalog = realCatalog;
  const invalid = [];
  for (const datasheet of realCatalog.datasheets) {
    const compositions = realCatalog.compositionsByDatasheetId.get(datasheet.id) || [];
    const composition = compositions.find((item) => item.isDefault) || compositions[0];
    if (!composition) {
      continue;
    }
    const miniatures = defaultMiniatures(datasheet.id, composition.id).map((miniature, index) => ({
      ...miniature,
      id: `${datasheet.id}:${miniature.miniatureId}:${index}`,
      rosterUnitMiniatureId: `${datasheet.id}:${miniature.miniatureId}:${index}`,
      name: realCatalog.miniatureById.get(miniature.miniatureId)?.name || "Model",
    }));
    const unit = {
      id: datasheet.id,
      name: datasheet.name,
      datasheetId: datasheet.id,
      modelCount: miniatures.reduce((total, miniature) => total + (miniature.count || 0), 0),
      wargear: defaultWargear(datasheet.id, composition.id),
      miniatures,
    };
    const messages = [];
    validateWargearLoadouts([unit], messages);
    const codes = messageCodes(messages);
    if (codes.length) {
      invalid.push({
        datasheet: datasheet.name,
        publication: realCatalog.publicationById.get(datasheet.publicationId)?.name,
        codes: [...new Set(codes)],
      });
    }
  }

  assert.deepEqual(invalid, []);
});

test("wargear validation reports invalid unit scope, invalid model scope, and unit/model loadout failures", () => {
  state.catalog = realCatalog;

  const unitScopedModelOption = defaultWargearUnit("Termagants");
  const scopedTermagant = miniatureInUnit(unitScopedModelOption, "Termagant");
  unitScopedModelOption.wargear = {
    [optionIdForMiniatureItem(unitScopedModelOption.datasheetId, scopedTermagant.miniatureId, "Fleshborer")]: 1,
  };
  const unitScopeMessages = [];
  validateWargearLoadouts([unitScopedModelOption], unitScopeMessages);
  assert.ok(messageCodes(unitScopeMessages).includes("wargear_loadout.invalid_unit_wargear"));

  const modelScopedForeignOption = defaultWargearUnit("Termagants");
  const foreignTermagant = miniatureInUnit(modelScopedForeignOption, "Termagant");
  const eliminatorMiniature = miniatureNamedForDatasheet("Eliminator Squad", "Eliminator");
  foreignTermagant.wargear = {
    [optionIdForMiniatureItem(datasheetNamed("Eliminator Squad").id, eliminatorMiniature.id, "Bolt sniper rifle")]: 1,
  };
  const modelScopeMessages = [];
  validateWargearLoadouts([modelScopedForeignOption], modelScopeMessages);
  assert.ok(messageCodes(modelScopeMessages).includes("wargear_loadout.invalid_model_wargear"));

  const invalidMiniatureLoadout = defaultWargearUnit("Termagants");
  const loadoutTermagant = miniatureInUnit(invalidMiniatureLoadout, "Termagant");
  setMiniatureWargear(invalidMiniatureLoadout, loadoutTermagant, {
    "Chitinous claws and teeth": 10,
  });
  const miniatureLoadoutMessages = [];
  validateWargearLoadouts([invalidMiniatureLoadout], miniatureLoadoutMessages);
  assert.ok(messageCodes(miniatureLoadoutMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));

  const invalidUnitLoadout = defaultWargearUnit("Breacher Team");
  invalidUnitLoadout.wargear = {};
  const unitLoadoutMessages = [];
  validateWargearLoadouts([invalidUnitLoadout], unitLoadoutMessages);
  assert.ok(messageCodes(unitLoadoutMessages).includes("wargear_loadout.invalid_unit_wargear_loadout"));
});
