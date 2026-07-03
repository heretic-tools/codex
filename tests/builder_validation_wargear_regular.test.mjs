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

test("’Ardmob Boyz duplicate-name Big Choppa loadout bridge stays valid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("’Ardmob Boyz");
  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
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
