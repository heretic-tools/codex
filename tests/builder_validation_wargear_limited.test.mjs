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
