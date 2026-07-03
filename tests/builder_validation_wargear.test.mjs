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
