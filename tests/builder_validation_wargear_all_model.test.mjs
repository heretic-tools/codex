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

test("Cthonian Beserks duplicate-name Heavy plasma axe all-model rule stays valid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Cthonian Beserks");
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
