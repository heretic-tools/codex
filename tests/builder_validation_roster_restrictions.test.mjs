import {
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
  defaultMiniatures,
  defaultMiniaturesForComposition,
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
  unitSummariesForPointsStep,
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
  warlordUnitForMiniature,
  withCatalog,
  withMiniatureEnhancement,
} from "./builder_validation_roster_restrictions_helpers.mjs";

test("data-empty model helper edge rows keep cached roster data routable", () => {
  state.catalog = realCatalog;

  const ability = realCatalog.allegianceAbilities[0];
  const selectedAbilities = modelSelectedAllegianceAbilities({
    allegianceAbilities: [null, 0, "missing-ability", ability.id, {
      id: ability.id,
      allegianceAbilityGroupId: ability.allegianceAbilityGroupId,
    }],
  });
  assert.equal(selectedAbilities.length, 2);
  assert.equal(selectedAbilities[0].groupId, ability.allegianceAbilityGroupId);

  const previousDocument = global.document;
  global.document = {
    ...previousDocument,
    createElement: (tagName) => ({ tagName, className: "", textContent: "" }),
  };
  try {
    const dispositionLink = realCatalog.detachmentForceDispositions[0];
    const dispositionDetachment = realCatalog.detachmentById.get(dispositionLink.detachmentId);
    const badge = modelDetachmentBadgeNode(dispositionDetachment);
    assert.equal(badge.textContent, dispositionDetachment.name);
    assert.match(badge.className, /^disposition-badge disposition-/);

    const dispositionBadge = modelDetachmentDispositionBadgeNode(dispositionDetachment);
    assert.equal(
      dispositionBadge.textContent,
      realCatalog.forceDispositionById.get(dispositionLink.forceDispositionId).name
    );

    withCatalog({ ...realCatalog, forceDispositionsByDetachmentId: new Map() }, () => {
      const fallbackBadge = modelDetachmentBadgeNode({ id: "test-detachment-without-disposition" });
      assert.equal(fallbackBadge.className, "meta-badge");
      assert.equal(fallbackBadge.textContent, "Detachment");
      assert.equal(modelDetachmentDispositionBadgeNode({ id: "test-detachment-without-disposition" }), null);
    });
  } finally {
    global.document = previousDocument;
  }

  const factionId = "test-model-faction";
  const parentFactionId = "test-model-parent-faction";
  const detachmentId = "test-model-detachment";
  const publicationId = "test-model-publication";
  const nativeDatasheetId = "test-model-native-datasheet";
  const noCompositionDatasheetId = "test-model-no-composition-datasheet";
  const factionExcludedDatasheetId = "test-model-faction-excluded-datasheet";
  const detachmentExcludedDatasheetId = "test-model-detachment-excluded-datasheet";
  const alliedDatasheetId = "test-model-allied-datasheet";
  const alliedNoParentDatasheetId = "test-model-allied-no-parent-datasheet";
  const equivalentDatasheetId = "test-model-equivalent-datasheet";
  const fallbackDatasheetId = "test-model-fallback-datasheet";
  const emptySavedDatasheetId = "test-model-empty-saved-datasheet";
  const impossibleLoadoutDatasheetId = "test-model-impossible-loadout-datasheet";
  const allyType = "test-model-ally";
  const noParentAllyType = "test-model-no-parent-ally";
  const unallowedAllyType = "test-model-unallowed-ally";
  const miniA = "test-model-mini-a";
  const miniB = "test-model-mini-b";
  const impossibleLoadoutMini = "test-model-impossible-loadout-mini";
  const impossibleLoadoutItem = "test-model-impossible-loadout-item";
  const missingMiniatureId = "test-model-missing-miniature";

  const datasheets = [
    { id: nativeDatasheetId, name: "Native Datasheet", publicationId, maxModelCount: 5 },
    { id: noCompositionDatasheetId, name: "No Composition Datasheet", publicationId, maxModelCount: 5 },
    { id: factionExcludedDatasheetId, name: "Faction Excluded Datasheet", publicationId, maxModelCount: 5 },
    { id: detachmentExcludedDatasheetId, name: "Detachment Excluded Datasheet", publicationId, maxModelCount: 5 },
    { id: alliedDatasheetId, name: "Allied Datasheet", publicationId, maxModelCount: 5 },
    { id: alliedNoParentDatasheetId, name: "Allied No Parent Datasheet", publicationId, maxModelCount: 5 },
    { id: equivalentDatasheetId, name: "Equivalent Datasheet", publicationId, maxModelCount: 5 },
    { id: fallbackDatasheetId, name: "Fallback Datasheet", publicationId, maxModelCount: 5 },
    { id: emptySavedDatasheetId, name: "Empty Saved Datasheet", publicationId, maxModelCount: 5 },
    { id: impossibleLoadoutDatasheetId, name: "Impossible Loadout Datasheet", publicationId, maxModelCount: 5 },
  ];
  const miniatures = [
    { id: miniA, datasheetId: nativeDatasheetId, name: "Model A" },
    { id: miniB, datasheetId: fallbackDatasheetId, name: "Model B" },
    { id: impossibleLoadoutMini, datasheetId: impossibleLoadoutDatasheetId, name: "Impossible Loadout Model" },
    { id: `${equivalentDatasheetId}:mini`, datasheetId: equivalentDatasheetId, name: "Equivalent Model" },
    { id: `${alliedDatasheetId}:mini`, datasheetId: alliedDatasheetId, name: "Allied Model" },
    { id: `${alliedNoParentDatasheetId}:mini`, datasheetId: alliedNoParentDatasheetId, name: "No Parent Allied Model" },
    { id: `${factionExcludedDatasheetId}:mini`, datasheetId: factionExcludedDatasheetId, name: "Excluded Model" },
    { id: `${detachmentExcludedDatasheetId}:mini`, datasheetId: detachmentExcludedDatasheetId, name: "Detachment Excluded Model" },
  ];
  const composition = (id, datasheetId, options = {}) => ({
    id,
    datasheetId,
    isDefault: Boolean(options.isDefault),
    displayOrder: options.displayOrder || 0,
    points: options.points || 0,
  });
  const compositions = [
    composition("test-native-composition", nativeDatasheetId, { isDefault: true, points: 101 }),
    composition("test-faction-excluded-composition", factionExcludedDatasheetId, { isDefault: true, points: 102 }),
    composition("test-detachment-excluded-composition", detachmentExcludedDatasheetId, { isDefault: true, points: 103 }),
    composition("test-allied-composition", alliedDatasheetId, { isDefault: true, points: 104 }),
    composition("test-allied-no-parent-composition", alliedNoParentDatasheetId, { isDefault: true, points: 105 }),
    composition("test-equivalent-saved", equivalentDatasheetId, { isDefault: false, points: 10 }),
    composition("test-equivalent-specific-display", equivalentDatasheetId, { isDefault: false, displayOrder: 1, points: 20 }),
    composition("test-equivalent-specific-default", equivalentDatasheetId, { isDefault: true, displayOrder: 2, points: 30 }),
    composition("test-fallback-saved", fallbackDatasheetId, { isDefault: true, points: 40 }),
    composition("test-fallback-detachment-default", fallbackDatasheetId, { isDefault: true, displayOrder: 1, points: 50 }),
    composition("test-empty-saved", emptySavedDatasheetId, { isDefault: false, points: 60 }),
    composition("test-impossible-loadout-composition", impossibleLoadoutDatasheetId, { isDefault: true, points: 70 }),
    composition("test-label-missing-miniature", nativeDatasheetId, { isDefault: false, points: 0 }),
  ];
  const compositionRows = new Map([
    ["test-native-composition", [{ miniatureId: miniA, min: 1, max: 1 }]],
    ["test-faction-excluded-composition", [{ miniatureId: `${factionExcludedDatasheetId}:mini`, min: 1, max: 1 }]],
    ["test-detachment-excluded-composition", [{ miniatureId: `${detachmentExcludedDatasheetId}:mini`, min: 1, max: 1 }]],
    ["test-allied-composition", [{ miniatureId: `${alliedDatasheetId}:mini`, min: 1, max: 1 }]],
    ["test-allied-no-parent-composition", [{ miniatureId: `${alliedNoParentDatasheetId}:mini`, min: 1, max: 1 }]],
    ["test-equivalent-saved", [{ miniatureId: `${equivalentDatasheetId}:mini`, min: 1, max: 1 }]],
    ["test-equivalent-specific-display", [{ miniatureId: `${equivalentDatasheetId}:mini`, min: 1, max: 1 }]],
    ["test-equivalent-specific-default", [{ miniatureId: `${equivalentDatasheetId}:mini`, min: 1, max: 1 }]],
    ["test-fallback-saved", [{ miniatureId: miniA, min: 1, max: 1 }]],
    ["test-fallback-detachment-default", [
      { miniatureId: miniA, min: 1, max: 1 },
      { miniatureId: miniB, min: 1, max: 1 },
    ]],
    ["test-empty-saved", []],
    ["test-impossible-loadout-composition", [{ miniatureId: impossibleLoadoutMini, min: 1, max: 1 }]],
    ["test-label-missing-miniature", [{ miniatureId: missingMiniatureId, min: 1, max: 2 }]],
  ]);
  const datasheetFactionRows = new Map([
    [nativeDatasheetId, [{ datasheetId: nativeDatasheetId, factionKeywordId: factionId }]],
    [noCompositionDatasheetId, [{ datasheetId: noCompositionDatasheetId, factionKeywordId: factionId }]],
    [factionExcludedDatasheetId, [{ datasheetId: factionExcludedDatasheetId, factionKeywordId: factionId }]],
    [detachmentExcludedDatasheetId, [{ datasheetId: detachmentExcludedDatasheetId, factionKeywordId: factionId }]],
    [equivalentDatasheetId, [{ datasheetId: equivalentDatasheetId, factionKeywordId: factionId }]],
    [fallbackDatasheetId, [{ datasheetId: fallbackDatasheetId, factionKeywordId: factionId }]],
    [emptySavedDatasheetId, [{ datasheetId: emptySavedDatasheetId, factionKeywordId: factionId }]],
    [impossibleLoadoutDatasheetId, [{ datasheetId: impossibleLoadoutDatasheetId, factionKeywordId: factionId }]],
    [alliedDatasheetId, [{ datasheetId: alliedDatasheetId, factionKeywordId: parentFactionId }]],
    [alliedNoParentDatasheetId, [{ datasheetId: alliedNoParentDatasheetId, factionKeywordId: parentFactionId }]],
  ]);
  const compositionsByDatasheetId = new Map();
  for (const item of compositions) {
    if (!compositionsByDatasheetId.has(item.datasheetId)) {
      compositionsByDatasheetId.set(item.datasheetId, []);
    }
    compositionsByDatasheetId.get(item.datasheetId).push(item);
  }

  const syntheticCatalog = {
    ...realCatalog,
    publications: [{ id: publicationId, name: "Test Publication", isCombatPatrol: false }],
    publicationById: new Map([[publicationId, { id: publicationId, name: "Test Publication", isCombatPatrol: false }]]),
    factionKeywords: [
      { id: factionId, name: "Test Faction" },
      { id: parentFactionId, name: "Parent Faction", parentFactionKeywordId: factionId },
    ],
    factionKeywordById: new Map([
      [factionId, { id: factionId, name: "Test Faction" }],
      [parentFactionId, { id: parentFactionId, name: "Parent Faction", parentFactionKeywordId: factionId }],
    ]),
    factionById: new Map([[factionId, { id: factionId, name: "Test Faction" }]]),
    detachments: [{ id: detachmentId, name: "Test Detachment", isCombatPatrol: false }],
    detachmentById: new Map([[detachmentId, { id: detachmentId, name: "Test Detachment", isCombatPatrol: false }]]),
    detachmentFactionKeywords: [{ detachmentId, factionKeywordId: factionId }],
    datasheets,
    datasheetById: new Map(datasheets.map((datasheet) => [datasheet.id, datasheet])),
    datasheetFactionKeywords: [...datasheetFactionRows.values()].flat(),
    datasheetFactionKeywordsByDatasheetId: datasheetFactionRows,
    factionExcludedDatasheets: [{ factionKeywordId: factionId, datasheetId: factionExcludedDatasheetId }],
    detachmentExcludedDatasheets: [
      { detachmentId, datasheetId: detachmentExcludedDatasheetId },
      { detachmentId, datasheetId: alliedNoParentDatasheetId },
    ],
    factionAlliedFactionsByFactionId: new Map([
      [factionId, [{ alliedFactionId: allyType }, { alliedFactionId: noParentAllyType }]],
      ["missing-faction", [{ alliedFactionId: noParentAllyType }]],
    ]),
    alliedFactionParentsByAlliedFactionId: new Map([
      [allyType, [{ alliedFactionId: allyType, factionKeywordId: parentFactionId }]],
    ]),
    alliedFactionDatasheetsByAlliedFactionId: new Map([
      [allyType, [{ alliedFactionId: allyType, datasheetId: alliedDatasheetId }]],
      [noParentAllyType, [{ alliedFactionId: noParentAllyType, datasheetId: alliedNoParentDatasheetId }]],
      [unallowedAllyType, [{ alliedFactionId: unallowedAllyType, datasheetId: alliedDatasheetId }]],
    ]),
    miniatureById: new Map(miniatures.map((miniature) => [miniature.id, miniature])),
    wargearItemById: new Map([
      ...realCatalog.wargearItemById,
      [impossibleLoadoutItem, { id: impossibleLoadoutItem, name: "Unmapped loadout item" }],
    ]),
    miniaturesByDatasheetId: new Map(datasheets.map((datasheet) => [
      datasheet.id,
      miniatures.filter((miniature) => miniature.datasheetId === datasheet.id),
    ])),
    miniatureKeywordsByMiniatureId: new Map(miniatures.map((miniature) => [miniature.id, []])),
    compositionById: new Map(compositions.map((item) => [item.id, item])),
    compositionsByDatasheetId,
    compositionMiniaturesByCompositionId: compositionRows,
    requiredFactionKeywordsByCompositionId: new Map(),
    requiredDetachmentsByCompositionId: new Map([
      ["test-equivalent-specific-display", [{ unitCompositionId: "test-equivalent-specific-display", detachmentId }]],
      ["test-equivalent-specific-default", [{ unitCompositionId: "test-equivalent-specific-default", detachmentId }]],
      ["test-fallback-detachment-default", [{ unitCompositionId: "test-fallback-detachment-default", detachmentId }]],
    ]),
    datasheetPointsStepsByDatasheetId: new Map(),
    enhancementKeywordPointsCostsByEnhancementId: new Map(),
    wargearGroupsByDatasheetId: new Map(),
    wargearOptionsByGroupId: new Map(),
    baseMiniatureLoadoutsByMiniatureId: new Map(),
    baseMiniatureLoadoutsByDatasheetId: new Map(),
    baseMiniatureLoadoutWargearOptionsByLoadoutId: new Map(),
    loadoutChoiceSetsByDatasheetId: new Map([[
      impossibleLoadoutDatasheetId,
      [{
        id: "test-impossible-loadout-set",
        datasheetId: impossibleLoadoutDatasheetId,
        miniatureId: impossibleLoadoutMini,
        limit: 1,
        allowDuplicates: false,
        alternate: false,
      }],
    ]]),
    loadoutChoicesBySetId: new Map([[
      "test-impossible-loadout-set",
      [{ id: "test-impossible-loadout-choice", loadoutChoiceSetId: "test-impossible-loadout-set" }],
    ]]),
    loadoutChoiceItemsByChoiceId: new Map([[
      "test-impossible-loadout-choice",
      [{
        id: "test-impossible-loadout-choice-item",
        loadoutChoiceId: "test-impossible-loadout-choice",
        wargearItemId: impossibleLoadoutItem,
        count: 1,
      }],
    ]]),
  };

  withCatalog(syntheticCatalog, () => {
    assert.deepEqual(modelCompositionFactionIds({ factionKeywordId: factionId }, allyType), [parentFactionId, factionId]);
    assert.deepEqual(modelCompositionFactionIds({ factionKeywordId: factionId }, unallowedAllyType), [factionId]);

    assert.deepEqual(
      modelAvailableUnitSources({ factionKeywordId: factionId }).map((source) => source.label),
      ["Test Faction", "Allied: Allied", "Allied: Parent Faction"]
    );
    assert.deepEqual(
      modelAvailableUnitSources({ factionKeywordId: "missing-faction" }).map((source) => source.label),
      ["Roster Faction", "Allied: Allied"]
    );

    const nativeIds = modelAvailableDatasheets({
      factionKeywordId: factionId,
      detachmentIds: [detachmentId],
      units: [],
    }).map((datasheet) => datasheet.id);
    assert.ok(nativeIds.includes(nativeDatasheetId));
    assert.ok(!nativeIds.includes(noCompositionDatasheetId));
    assert.ok(!nativeIds.includes(factionExcludedDatasheetId));
    assert.ok(!nativeIds.includes(detachmentExcludedDatasheetId));

    const alliedIds = modelAvailableDatasheets({
      factionKeywordId: factionId,
      detachmentIds: [detachmentId],
      units: [],
    }, allyType).map((datasheet) => datasheet.id);
    assert.deepEqual(alliedIds, [alliedDatasheetId]);
    assert.deepEqual(modelAvailableDatasheets({
      factionKeywordId: factionId,
      detachmentIds: [detachmentId],
      units: [],
    }, noParentAllyType), []);
    assert.deepEqual(modelAvailableDatasheets({
      factionKeywordId: factionId,
      detachmentIds: [],
      units: [],
    }, unallowedAllyType), []);

    assert.equal(modelCompositionLabel({ id: "test-empty-saved" }), "Composition");
    assert.equal(modelCompositionLabel({ id: "test-label-missing-miniature" }), "1-2 model");
    assert.deepEqual(
      defaultMiniatures(impossibleLoadoutDatasheetId, "test-impossible-loadout-composition")[0].wargear,
      {}
    );

    const roster = {
      factionKeywordId: factionId,
      battleSizeId: "test-battle-size",
      detachmentIds: [detachmentId],
      units: [
        { id: "empty-saved-unit", datasheetId: emptySavedDatasheetId, compositionId: "test-empty-saved" },
        { id: "equivalent-unit", datasheetId: equivalentDatasheetId, compositionId: "test-equivalent-saved" },
        { id: "fallback-unit", datasheetId: fallbackDatasheetId, compositionId: "test-fallback-saved" },
      ],
    };
    const summaries = modelRosterUnitSummaries(roster);
    assert.equal(summaries[0].selectedCompositionId, "test-empty-saved");
    assert.equal(summaries[0].modelCount, 0);
    assert.equal(summaries[1].selectedCompositionId, "test-equivalent-specific-default");
    assert.equal(summaries[2].selectedCompositionId, "test-fallback-detachment-default");
    assert.equal(modelRosterPoints(roster), 140);

    const zeroCountSummary = modelRosterUnitSummaries({
      factionKeywordId: factionId,
      battleSizeId: "test-battle-size",
      detachmentIds: [],
      units: [{
        id: "zero-count-unit",
        datasheetId: nativeDatasheetId,
        compositionId: "test-native-composition",
        miniatures: [{ miniatureId: miniA, count: 0, wargear: {} }],
      }],
    })[0];
    assert.equal(zeroCountSummary.modelCount, 0);
    assert.deepEqual(zeroCountSummary.keywordIds, []);
  });

  let exclusionChecks = 0;
  withCatalog({
    ...syntheticCatalog,
    datasheets: [datasheets.find((datasheet) => datasheet.id === nativeDatasheetId)],
    factionExcludedDatasheets: {
      some(predicate) {
        exclusionChecks += 1;
        return exclusionChecks > 1 && predicate({ factionKeywordId: factionId, datasheetId: nativeDatasheetId });
      },
    },
  }, () => {
    assert.deepEqual(modelAvailableDatasheets({
      factionKeywordId: factionId,
      detachmentIds: [],
      units: [],
    }), []);
  });
});
