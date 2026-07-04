import {
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
  datasheetIdForEnhancementBodyguard,
  addCounts,
  loadoutChoiceSets,
  validLoadoutsFromChoiceSets,
  wargearLoadoutMatchesChoiceSets,
  wargearPoints,
  addNameAliasContext,
  auditedNameAliasContexts,
  countBy,
  miniatureBelongsToDatasheet,
  catalogWithOnlyLoadoutChoiceSet,
  choiceIsRepresented,
  invalidCountsForLoadout,
  limitedSetForChoice,
  limitedSetForLimit,
  limitedChoiceRows,
  firstNonEmptyLimitedChoice,
  selectionRowsForChoice,
  syntheticOptionId,
  syntheticWargearRowsForChoices,
  syntheticRegularLoadoutRows,
  catalogWithLimitedWargearScenario,
  selectedOptionCountsForLimitedScenario,
  unitForLimitedWargearScenario,
  validateLimitedWargearScenario,
  allModelChoiceRows,
  allModelChoicesForSet,
  allModelSelectionRows,
  syntheticAllModelOptionId,
  syntheticWargearRowsForAllModelChoices,
  catalogWithAllModelWargearScenario,
  selectedOptionCountsForAllModelScenario,
  unitForAllModelWargearScenario,
  validateAllModelWargearScenario,
  baseLoadoutRows,
  optionMatchesBaseLoadoutScope,
  directBaseLoadoutRows,
  foreignBaseLoadoutRows,
  catalogWithOnlyBaseLoadout,
  defaultMiniaturesForBaseLoadout,
  wargearGroupForOption,
  datasheetMiniatureForGroup,
  catalogWithRawDefaultMiniature,
  rawDefaultMiniatureWargear,
  catalogWithOnlyWargearOption,
  unitForWargearOptionScope,
  validateWargearOptionScope,
} from "./builder_validation_wargear_helpers.mjs";

test("data-empty wargear loadout math edge rows stay covered", () => {
  const syntheticAliases = new Map([
    ["test-datasheet:test-miniature", new Map([
      ["test-item", "name:exact duplicate bridge"],
    ])],
    ["test-datasheet:", new Map([
      ["test-item", "name:datasheet duplicate bridge"],
      ["test-wide-item", "name:datasheet wide bridge"],
    ])],
  ]);

  withCatalog({ ...realCatalog, wargearAliasesByContext: syntheticAliases }, () => {
    assert.equal(canonicalWargearKey("", {
      datasheetId: "test-datasheet",
      miniatureId: "test-miniature",
    }), "");
    assert.equal(canonicalWargearKey("test-item", {
      datasheetId: "test-datasheet",
      miniatureId: "test-miniature",
    }), "name:exact duplicate bridge");
    assert.equal(canonicalWargearKey("test-wide-item", {
      datasheetId: "test-datasheet",
      miniatureId: "test-miniature",
    }), "name:datasheet wide bridge");
  });

  assert.deepEqual(validLoadoutsFromChoiceSets([{
    id: "test-zero-limit-loadout-set",
    limit: 0,
    choices: [],
  }]), [{}]);
  assert.deepEqual(validLoadoutsFromChoiceSets([{
    id: "test-empty-regular-loadout-set",
    limit: 1,
    choices: [],
  }]), []);
  assert.deepEqual(validLoadoutsFromChoiceSets([{
    id: "test-over-limit-loadout-set",
    limit: 2,
    allowDuplicates: false,
    choices: [{ "id:test-only-choice": 1 }],
  }]), []);
});

test("precomputed loadout fingerprints short-circuit full catalog contexts", () => {
  const catalog = {
    ...realCatalog,
    precomputedLoadoutsByContext: new Map([[
      "test-datasheet:test-miniature",
      ["id:test-item:1"],
    ]]),
    loadoutChoiceSetsByDatasheetId: new Map([[
      "test-datasheet",
      [{
        id: "test-loadout-set",
        datasheetId: "test-datasheet",
        miniatureId: "test-miniature",
        limit: 1,
        allowDuplicates: false,
        alternate: false,
      }],
    ]]),
    loadoutChoicesBySetId: new Map([[
      "test-loadout-set",
      [{ id: "test-loadout-choice", loadoutChoiceSetId: "test-loadout-set" }],
    ]]),
    loadoutChoiceItemsByChoiceId: new Map([[
      "test-loadout-choice",
      [{ loadoutChoiceId: "test-loadout-choice", wargearItemId: "test-item", count: 1 }],
    ]]),
    wargearAliasesByContext: new Map(),
    wargearItemById: new Map([["test-item", { id: "test-item", name: "Test Item" }]]),
  };

  withCatalog(catalog, () => {
    const sets = loadoutChoiceSets("test-datasheet", "test-miniature");
    assert.deepEqual(validLoadoutsFromChoiceSets(sets), [{ "id:test-item": 1 }]);
    assert.ok(wargearLoadoutMatchesChoiceSets("test-datasheet", "test-miniature", { "id:test-item": 1 }, 1));
    assert.ok(!wargearLoadoutMatchesChoiceSets("test-datasheet", "test-miniature", { "id:test-item": 2 }, 1));
  });
});

test("data-empty wargear requirement edge rows stay covered", () => {
  const noLimitSet = realCatalog.limitedWargearChoiceSets.find((set) => (
    (realCatalog.limitedWargearChoicesBySetId.get(set.id) || []).some((choice) => limitedChoiceRows(choice).length)
  ));
  assert.ok(noLimitSet, "Expected a live limited wargear set");
  const noLimitChoice = firstNonEmptyLimitedChoice(noLimitSet);
  const noLimitRows = selectionRowsForChoice(noLimitChoice, 1);
  const noLimitCatalog = {
    ...catalogWithLimitedWargearScenario(noLimitSet, { modelCount: 1, choiceLimit: 1 }, noLimitChoice, noLimitRows),
    wargearLimitsByLimitedSetId: new Map(),
  };
  const noLimitUnit = unitForLimitedWargearScenario(noLimitSet, { modelCount: 1 }, noLimitRows);
  const noLimitMessages = [];
  withCatalog(noLimitCatalog, () => validateWargearLoadouts([noLimitUnit], noLimitMessages));
  assert.ok(!messageCodes(noLimitMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const scopedUnit = defaultWargearUnit("Termagants");
  const scopedMiniatures = scopedUnit.miniatures;
  scopedUnit.miniatures = {
    *[Symbol.iterator]() {
      yield* scopedMiniatures;
    },
    find(predicate) {
      try {
        predicate(null);
      } catch {
        // Some model-count predicates are not null-tolerant; the target matcher is.
      }
      return scopedMiniatures.find(predicate);
    },
  };
  const scopedMessages = [];
  withCatalog(realCatalog, () => validateWargearLoadouts([scopedUnit], scopedMessages));
  assert.ok(!messageCodes(scopedMessages).includes("wargear_loadout.invalid_model_wargear"));

  const comboChoice = realCatalog.limitedWargearChoices.find((choice) => limitedChoiceRows(choice).length >= 2);
  assert.ok(comboChoice, "Expected a live multi-item limited wargear choice");
  const comboSet = limitedSetForChoice(comboChoice);
  const comboLimit = (realCatalog.wargearLimitsByLimitedSetId.get(comboSet.id) || [])
    .find((limit) => Number(limit.choiceLimit || 0) > 0);
  assert.ok(comboLimit, `Expected accepting limited wargear limit for set ${comboSet.id}`);
  const partialComboRows = [selectionRowsForChoice(comboChoice, 1)[0]];
  const partialComboMessages = [];
  withCatalog(
    catalogWithLimitedWargearScenario(comboSet, comboLimit, comboChoice, partialComboRows),
    () => validateWargearLoadouts([
      unitForLimitedWargearScenario(comboSet, comboLimit, partialComboRows),
    ], partialComboMessages)
  );
  assert.ok(messageCodes(partialComboMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const duplicateChoice = {
    ...noLimitChoice,
    id: `${noLimitChoice.id}:duplicate-vector`,
  };
  const duplicateLimit = (realCatalog.wargearLimitsByLimitedSetId.get(noLimitSet.id) || [])
    .find((limit) => Number(limit.choiceLimit || 0) > 0);
  assert.ok(duplicateLimit, `Expected accepting limited wargear limit for set ${noLimitSet.id}`);
  const duplicateRows = selectionRowsForChoice(noLimitChoice, 1);
  const duplicateCatalog = {
    ...catalogWithLimitedWargearScenario(noLimitSet, duplicateLimit, noLimitChoice, duplicateRows),
    limitedWargearChoicesBySetId: new Map([[noLimitSet.id, [noLimitChoice, duplicateChoice]]]),
    limitedWargearChoiceItemsByChoiceId: new Map([
      [noLimitChoice.id, limitedChoiceRows(noLimitChoice)],
      [duplicateChoice.id, limitedChoiceRows(noLimitChoice)],
    ]),
  };
  const duplicateMessages = [];
  withCatalog(duplicateCatalog, () => validateWargearLoadouts([
    unitForLimitedWargearScenario(noLimitSet, duplicateLimit, duplicateRows),
  ], duplicateMessages));
  assert.ok(!messageCodes(duplicateMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const skipItemId = limitedChoiceRows(noLimitChoice)[0].wargearItemId;
  const skipLimit = {
    id: "test-skip-oversized-limited-vector",
    limitedWargearChoiceSetId: noLimitSet.id,
    modelCount: 1,
    choiceLimit: 1,
    duplicateLimit: 1,
  };
  const oversizedChoice = {
    id: "test-oversized-limited-choice",
    limitedWargearChoiceSetId: noLimitSet.id,
  };
  const exactChoice = {
    id: "test-exact-limited-choice",
    limitedWargearChoiceSetId: noLimitSet.id,
  };
  const skipRows = [{ wargearItemId: skipItemId, count: 1 }];
  const skipRegular = syntheticRegularLoadoutRows(noLimitSet, skipRows);
  const skipGroup = {
    id: "test-skip-limited-group",
    datasheetId: noLimitSet.datasheetId,
    miniatureId: noLimitSet.miniatureId || null,
    isStaticWargear: false,
  };
  const skipOption = {
    id: syntheticOptionId(noLimitSet, skipItemId),
    wargearOptionGroupId: skipGroup.id,
    wargearItemId: skipItemId,
    defaultValue: 0,
    inputType: "stepper",
    points: 0,
  };
  const skipCatalog = {
    ...realCatalog,
    loadoutChoiceSetsByDatasheetId: new Map([[noLimitSet.datasheetId, [skipRegular.loadoutSet]]]),
    loadoutChoicesBySetId: new Map([[skipRegular.loadoutSet.id, skipRegular.choices]]),
    loadoutChoiceItemsByChoiceId: new Map([
      [skipRegular.choices[0].id, []],
      [skipRegular.selectedChoiceId, skipRegular.items],
    ]),
    limitedWargearChoiceSetsByDatasheetId: new Map([[noLimitSet.datasheetId, [noLimitSet]]]),
    limitedWargearChoicesBySetId: new Map([[noLimitSet.id, [oversizedChoice, exactChoice]]]),
    limitedWargearChoiceItemsByChoiceId: new Map([
      [oversizedChoice.id, [{
        id: "test-oversized-limited-choice-item",
        limitedWargearChoiceId: oversizedChoice.id,
        wargearItemId: skipItemId,
        count: 2,
      }]],
      [exactChoice.id, [{
        id: "test-exact-limited-choice-item",
        limitedWargearChoiceId: exactChoice.id,
        wargearItemId: skipItemId,
        count: 1,
      }]],
    ]),
    wargearLimitsByLimitedSetId: new Map([[noLimitSet.id, [skipLimit]]]),
    allModelWargearChoiceSetsByDatasheetId: new Map(),
    allModelWargearChoicesBySetId: new Map(),
    allModelWargearChoiceItemsByChoiceId: new Map(),
    wargearGroups: [skipGroup],
    wargearOptions: [skipOption],
    wargearGroupById: new Map([[skipGroup.id, skipGroup]]),
    wargearOptionById: new Map([[skipOption.id, skipOption]]),
    wargearGroupsByDatasheetId: new Map([[noLimitSet.datasheetId, [skipGroup]]]),
    wargearOptionsByGroupId: new Map([[skipGroup.id, [skipOption]]]),
  };
  const skipMessages = [];
  withCatalog(skipCatalog, () => validateWargearLoadouts([
    unitForLimitedWargearScenario(noLimitSet, skipLimit, skipRows),
  ], skipMessages));
  assert.ok(!messageCodes(skipMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const datasheet = datasheetNamed("Termagants");
  const miniature = miniatureNamedForDatasheet("Termagants", "Termagant");
  const emptyAllModelSet = {
    id: "test-empty-all-model-set",
    datasheetId: datasheet.id,
    miniatureId: miniature.id,
  };
  const emptyAllModelChoice = {
    id: "test-empty-all-model-choice",
    allModelWargearChoiceSetId: emptyAllModelSet.id,
    substitute: false,
  };
  const emptyAllModelUnit = {
    id: "test-empty-all-model-unit",
    name: datasheet.name,
    datasheetId: datasheet.id,
    modelCount: 1,
    wargear: {},
    miniatures: [{
      id: "test-empty-all-model-miniature",
      rosterUnitMiniatureId: "test-empty-all-model-miniature",
      miniatureId: miniature.id,
      name: miniature.name,
      count: 1,
      wargear: {},
    }],
  };
  const emptyAllModelMessages = [];
  withCatalog({
    ...realCatalog,
    loadoutChoiceSetsByDatasheetId: new Map(),
    loadoutChoicesBySetId: new Map(),
    loadoutChoiceItemsByChoiceId: new Map(),
    limitedWargearChoiceSetsByDatasheetId: new Map(),
    limitedWargearChoicesBySetId: new Map(),
    limitedWargearChoiceItemsByChoiceId: new Map(),
    wargearLimitsByLimitedSetId: new Map(),
    allModelWargearChoiceSetsByDatasheetId: new Map([[datasheet.id, [emptyAllModelSet]]]),
    allModelWargearChoicesBySetId: new Map([[emptyAllModelSet.id, [emptyAllModelChoice]]]),
    allModelWargearChoiceItemsByChoiceId: new Map([[emptyAllModelChoice.id, []]]),
  }, () => validateWargearLoadouts([emptyAllModelUnit], emptyAllModelMessages));
  assert.deepEqual(messageCodes(emptyAllModelMessages), []);
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
