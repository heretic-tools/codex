import assert from "node:assert/strict";
import test from "node:test";
import {
  state,
  availableCompositions,
  availableDatasheets,
  availableDetachments,
  costForDetachment,
  datasheetFactionIds,
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  defaultMiniatures,
  defaultWargear,
  detachmentDispositionName,
  factionExcludesDatasheet,
  factionScope,
  unitSummary,
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

test("generic warlord validation covers missing, multiple, invalid, and Supreme Commander cases", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };

  const missingMessages = [];
  validateWarlord(roster, [], [
    enhancementTargetUnit({
      id: "captain",
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
    }),
  ], missingMessages);
  assert.ok(messageCodes(missingMessages).includes("warlord.not_selected"));

  const multipleMessages = [];
  validateWarlord(roster, [], [
    enhancementTargetUnit({
      id: "captain",
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
      isWarlord: true,
    }),
    enhancementTargetUnit({
      id: "librarian",
      datasheetName: "Librarian",
      miniatureName: "Librarian",
      factionNames: ["Adeptus Astartes"],
      isWarlord: true,
    }),
  ], multipleMessages);
  assert.ok(messageCodes(multipleMessages).includes("warlord.multiple_selected"));

  const invalidMessages = [];
  validateWarlord(roster, [], [
    enhancementTargetUnit({
      id: "intercessor-sergeant",
      datasheetName: "Intercessor Squad",
      miniatureName: "Intercessor Sergeant",
      factionNames: ["Adeptus Astartes"],
      isWarlord: true,
    }),
  ], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("warlord.invalid_generic"));

  const headhunterGroup = allegianceGroup("Headhunter Task Force Keywords", "Headhunter Task Force", ["Character"]);
  const headhunterCharacter = allegianceAbility(headhunterGroup.id, "Character");
  const vindicatorWithoutCharacter = enhancementTargetUnit({
    id: "vindicator-without-character",
    datasheetName: "Vindicator",
    miniatureName: "Vindicator",
    factionNames: ["Adeptus Astartes"],
    isWarlord: true,
  });
  const conditionalCharacterMissingMessages = [];
  validateWarlord(roster, [detachmentNamed("Headhunter Task Force")], [vindicatorWithoutCharacter], conditionalCharacterMissingMessages);
  assert.ok(messageCodes(conditionalCharacterMissingMessages).includes("warlord.invalid_generic"));

  const vindicatorWithCharacter = {
    ...vindicatorWithoutCharacter,
    id: "vindicator-with-character",
    allegianceAbilityGroupId: headhunterGroup.id,
    allegianceAbilities: [headhunterCharacter.id],
  };
  const conditionalCharacterMessages = [];
  validateWarlord(roster, [detachmentNamed("Headhunter Task Force")], [vindicatorWithCharacter], conditionalCharacterMessages);
  assert.ok(!messageCodes(conditionalCharacterMessages).includes("warlord.invalid_generic"));

  const supremeCommanderMessages = [];
  validateWarlord(roster, [], [
    enhancementTargetUnit({
      id: "guilliman",
      datasheetName: "Roboute Guilliman",
      miniatureName: "Roboute Guilliman",
      factionNames: ["Adeptus Astartes", "Ultramarines"],
    }),
    enhancementTargetUnit({
      id: "captain-warlord",
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
      isWarlord: true,
    }),
  ], supremeCommanderMessages);
  assert.ok(messageCodes(supremeCommanderMessages).includes("mandatory_warlord.supreme_commander_not_selected"));

  const deathleaperWarlord = enhancementTargetUnit({
    id: "deathleaper",
    datasheetName: "Deathleaper",
    miniatureName: "Deathleaper",
    factionNames: ["Tyranids"],
    isWarlord: true,
  });
  const deathleaperWithoutGrantMessages = [];
  validateWarlord({
    factionKeywordId: factionNamed("Tyranids").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  }, [], [deathleaperWarlord], deathleaperWithoutGrantMessages);
  assert.ok(messageCodes(deathleaperWithoutGrantMessages).includes("warlord.invalid_generic"));

  const deathleaperWithGrantMessages = [];
  validateWarlord({
    factionKeywordId: factionNamed("Tyranids").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  }, [detachmentNamed("Vanguard Onslaught")], [deathleaperWarlord], deathleaperWithGrantMessages);
  assert.ok(!messageCodes(deathleaperWithGrantMessages).includes("warlord.invalid_generic"));
});

test("all live warlord miniature flags have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  const supremeCommanders = realCatalog.miniatures.filter((miniature) => miniature.isSupremeCommander);
  const cannotBeWarlords = realCatalog.miniatures.filter((miniature) => miniature.cannotBeWarlord);
  const nonCharacterWarlords = realCatalog.miniatures.filter((miniature) => miniature.canBeNonCharacterWarlord);
  let supremeInvalidRows = 0;
  let supremeValidRows = 0;
  let cannotRows = 0;
  let grantedRows = 0;
  let nonCharacterRows = 0;

  assert.equal(supremeCommanders.length, 17);
  assert.equal(cannotBeWarlords.length, 27);
  assert.equal(nonCharacterWarlords.length, 8);
  assert.equal(realCatalog.detachmentGrantedWarlordMiniatures.length, 1);
  assert.ok(supremeCommanders.every((miniature) => keywordIdsForDatasheet(miniature.datasheetId)
    .some((keywordId) => realCatalog.keywordById.get(keywordId)?.name === "Character")));
  assert.ok(nonCharacterWarlords.every((miniature) => !keywordIdsForDatasheet(miniature.datasheetId)
    .some((keywordId) => realCatalog.keywordById.get(keywordId)?.name === "Character")));

  for (const miniature of supremeCommanders) {
    const roster = {
      factionKeywordId: rosterFactionIdForDatasheet(miniature.datasheetId),
      battleSizeId: battleSizeNamed("Strike Force").id,
    };
    const wrongWarlordMessages = [];
    validateWarlord(roster, [], [
      warlordUnitForMiniature(miniature.id, `${miniature.id}:supreme-present`, { isWarlord: false }),
      enhancementTargetUnit({
        id: `${miniature.id}:captain-warlord`,
        datasheetName: "Captain",
        miniatureName: "Captain",
        factionNames: ["Adeptus Astartes"],
        isWarlord: true,
      }),
    ], wrongWarlordMessages);
    assert.ok(
      messageCodes(wrongWarlordMessages).includes("mandatory_warlord.supreme_commander_not_selected"),
      `${miniature.name} should require a Supreme Commander Warlord`
    );
    supremeInvalidRows += 1;

    const selectedMessages = [];
    validateWarlord(roster, [], [
      warlordUnitForMiniature(miniature.id, `${miniature.id}:supreme-selected`, { isWarlord: true }),
    ], selectedMessages);
    assert.ok(!messageCodes(selectedMessages).includes("mandatory_warlord.supreme_commander_not_selected"));
    assert.ok(!messageCodes(selectedMessages).includes("warlord.invalid_generic"));
    supremeValidRows += 1;
  }

  for (const miniature of cannotBeWarlords) {
    const roster = {
      factionKeywordId: rosterFactionIdForDatasheet(miniature.datasheetId),
      battleSizeId: battleSizeNamed("Strike Force").id,
    };
    const invalidMessages = [];
    validateWarlord(roster, [], [
      warlordUnitForMiniature(miniature.id, `${miniature.id}:cannot`, { isWarlord: true }),
    ], invalidMessages);
    assert.ok(
      messageCodes(invalidMessages).includes("warlord.invalid_generic"),
      `${miniature.name} should not be a Warlord by default`
    );
    cannotRows += 1;

    for (const row of realCatalog.detachmentGrantedWarlordsByMiniatureId.get(miniature.id) || []) {
      const detachment = realCatalog.detachmentById.get(row.detachmentId);
      const grantedMessages = [];
      validateWarlord(roster, [detachment], [
        warlordUnitForMiniature(miniature.id, `${miniature.id}:granted`, { isWarlord: true }),
      ], grantedMessages);
      assert.ok(
        !messageCodes(grantedMessages).includes("warlord.invalid_generic"),
        `${detachment?.name} should grant ${miniature.name} Warlord eligibility`
      );
      grantedRows += 1;
    }
  }

  for (const miniature of nonCharacterWarlords) {
    const roster = {
      factionKeywordId: rosterFactionIdForDatasheet(miniature.datasheetId),
      battleSizeId: battleSizeNamed("Strike Force").id,
    };
    const validMessages = [];
    validateWarlord(roster, [], [
      warlordUnitForMiniature(miniature.id, `${miniature.id}:non-character`, { isWarlord: true }),
    ], validMessages);
    assert.ok(
      !messageCodes(validMessages).includes("warlord.invalid_generic"),
      `${miniature.name} should be Warlord eligible without Character`
    );
    nonCharacterRows += 1;
  }

  assert.equal(supremeInvalidRows, 17);
  assert.equal(supremeValidRows, 17);
  assert.equal(cannotRows, 27);
  assert.equal(grantedRows, 1);
  assert.equal(nonCharacterRows, 8);
});

test("faction mandatory warlord validation covers missing required model and wrong selection", () => {
  const mandatoryMiniature = { id: "mandatory-model", name: "Mandatory Model" };
  const otherMiniature = { id: "other-model", name: "Other Model" };
  const characterKeyword = { id: "character-keyword", name: "Character" };
  const catalog = {
    factionKeywordById: new Map([[
      "synthetic-faction",
      {
        id: "synthetic-faction",
        name: "Synthetic Faction",
        mandatoryWarlordId: mandatoryMiniature.id,
      },
    ], [
      "child-faction",
      {
        id: "child-faction",
        name: "Child Faction",
        parentFactionKeywordId: "parent-faction",
      },
    ], [
      "parent-faction",
      {
        id: "parent-faction",
        name: "Parent Faction",
        parentFactionKeywordId: "",
        mandatoryWarlordId: mandatoryMiniature.id,
      },
    ]]),
    factionById: new Map(),
    miniatureById: new Map([
      [mandatoryMiniature.id, mandatoryMiniature],
      [otherMiniature.id, otherMiniature],
    ]),
    detachmentGrantedWarlordsByMiniatureId: new Map(),
    conditionalKeywordsByDatasheetId: new Map(),
    keywordById: new Map([[characterKeyword.id, characterKeyword]]),
    miniatureKeywordsByMiniatureId: new Map([
      [mandatoryMiniature.id, [{ keywordId: characterKeyword.id }]],
      [otherMiniature.id, [{ keywordId: characterKeyword.id }]],
    ]),
    detachmentMandatoryWarlordsByDetachmentId: new Map(),
  };
  const roster = { factionKeywordId: "synthetic-faction" };

  withCatalog(catalog, () => {
    const missingMessages = [];
    validateWarlord(roster, [], [{
      id: "other-unit",
      name: "Other Unit",
      datasheetId: "other-datasheet",
      warlordMiniatureIds: [otherMiniature.id],
      miniatures: [{
        miniatureId: otherMiniature.id,
        count: 1,
      }],
      allegianceAbilities: [],
    }], missingMessages);
    assert.ok(messageCodes(missingMessages).includes("mandatory_warlord.not_present_in_roster"));

    const notSelectedMessages = [];
    validateWarlord(roster, [], [{
      id: "mandatory-unit",
      name: "Mandatory Unit",
      datasheetId: "mandatory-datasheet",
      warlordMiniatureIds: [],
      miniatures: [{
        miniatureId: mandatoryMiniature.id,
        count: 1,
      }],
      allegianceAbilities: [],
    }], notSelectedMessages);
    assert.ok(messageCodes(notSelectedMessages).includes("mandatory_warlord.not_selected"));

    const parentScopeMessages = [];
    validateWarlord({ factionKeywordId: "child-faction" }, [], [{
      id: "other-unit",
      name: "Other Unit",
      datasheetId: "other-datasheet",
      warlordMiniatureIds: [otherMiniature.id],
      miniatures: [{
        miniatureId: otherMiniature.id,
        count: 1,
      }],
      allegianceAbilities: [],
    }], parentScopeMessages);
    assert.ok(messageCodes(parentScopeMessages).includes("mandatory_warlord.not_present_in_roster"));
  });
});

test("all live detachment warlord rows have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.detachmentMandatoryWarlordMiniatures.length, 2);
  assert.equal(realCatalog.detachmentGrantedWarlordMiniatures.length, 1);

  const unitForWarlordMiniature = (miniatureId, id) => {
    const miniature = realCatalog.miniatureById.get(miniatureId);
    assert.ok(miniature, `Expected miniature ${miniatureId}`);
    const datasheet = realCatalog.datasheetById.get(miniature.datasheetId);
    assert.ok(datasheet, `Expected datasheet for ${miniature.name}`);
    const rosterUnitMiniatureId = `${id}:${miniatureId}`;
    return {
      id,
      name: datasheet.name,
      datasheetId: datasheet.id,
      allyType: "native",
      factionKeywordIds: (realCatalog.datasheetFactionKeywordsByDatasheetId.get(datasheet.id) || [])
        .map((row) => row.factionKeywordId),
      keywordIds: keywordIdsForDatasheet(datasheet.id),
      warlordMiniatureIds: [miniatureId],
      unitEnhancements: [],
      miniatureEnhancements: [],
      allegianceAbilities: [],
      miniatures: [{
        ...miniature,
        id: rosterUnitMiniatureId,
        rosterUnitMiniatureId,
        miniatureId,
        count: 1,
        isWarlord: true,
        wargear: {},
      }],
    };
  };

  const mandatoryRowsByDetachmentId = new Map();
  for (const row of realCatalog.detachmentMandatoryWarlordMiniatures) {
    if (!mandatoryRowsByDetachmentId.has(row.detachmentId)) {
      mandatoryRowsByDetachmentId.set(row.detachmentId, []);
    }
    mandatoryRowsByDetachmentId.get(row.detachmentId).push(row);
  }
  assert.equal(mandatoryRowsByDetachmentId.size, 1);
  const wrongWarlordId = miniatureNamed("Farseer").id;
  for (const [detachmentId, rows] of mandatoryRowsByDetachmentId.entries()) {
    assert.ok(!rows.some((row) => row.miniatureId === wrongWarlordId));
    const detachment = realCatalog.detachmentById.get(detachmentId);
    assert.ok(detachment, `${detachmentId} should resolve to a detachment`);
    const rosterFactionId = realCatalog.detachmentFactionKeywords.find((row) => row.detachmentId === detachmentId)?.factionKeywordId;
    assert.ok(rosterFactionId, `${detachment.name} should have a roster faction`);

    const invalidMessages = [];
    validateWarlord(
      { factionKeywordId: rosterFactionId, battleSizeId: battleSizeNamed("Strike Force").id },
      [detachment],
      [unitForWarlordMiniature(wrongWarlordId, `${detachmentId}:wrong-warlord`)],
      invalidMessages
    );
    assert.ok(messageCodes(invalidMessages).includes("mandatory_warlord.detachment_not_selected"));

    for (const row of rows) {
      const validMessages = [];
      validateWarlord(
        { factionKeywordId: rosterFactionId, battleSizeId: battleSizeNamed("Strike Force").id },
        [detachment],
        [unitForWarlordMiniature(row.miniatureId, `${detachmentId}:${row.miniatureId}:required`)],
        validMessages
      );
      assert.ok(!messageCodes(validMessages).includes("mandatory_warlord.detachment_not_selected"));
    }
  }

  for (const row of realCatalog.detachmentGrantedWarlordMiniatures) {
    const detachment = realCatalog.detachmentById.get(row.detachmentId);
    const unit = unitForWarlordMiniature(row.miniatureId, `${row.detachmentId}:${row.miniatureId}:granted`);
    const roster = {
      factionKeywordId: unit.factionKeywordIds[0],
      battleSizeId: battleSizeNamed("Strike Force").id,
    };
    const blockedMessages = [];
    validateWarlord(roster, [], [unit], blockedMessages);
    assert.ok(messageCodes(blockedMessages).includes("warlord.invalid_generic"));

    const grantedMessages = [];
    validateWarlord(roster, [detachment], [unit], grantedMessages);
    assert.ok(!messageCodes(grantedMessages).includes("warlord.invalid_generic"));
  }
});

test("all live detachment faction, cost, and disposition rows are applied", () => {
  state.catalog = realCatalog;
  const rows = realCatalog.detachmentFactionKeywords;
  const allFactionIds = [...new Set(rows.map((row) => row.factionKeywordId))];
  let allowedRows = 0;
  let unavailableControlRows = 0;
  let listedRows = 0;
  let combatPatrolHiddenRows = 0;
  let overrideRows = 0;
  let baseCostRows = 0;
  const dispositionCounts = {};

  assert.equal(realCatalog.detachments.length, 290);
  assert.equal(rows.length, 457);
  assert.equal(realCatalog.detachmentFactionPointCosts.length, 4);
  assert.equal(realCatalog.detachmentForceDispositions.length, 290);
  assert.equal(realCatalog.forceDispositions.length, 5);
  assert.equal(rows.filter((row) => realCatalog.detachmentById.get(row.detachmentId)?.isCombatPatrol).length, 24);
  assert.equal(rows.filter((row) => !realCatalog.detachmentById.get(row.detachmentId)?.isCombatPatrol).length, 433);

  for (const row of rows) {
    const detachment = realCatalog.detachmentById.get(row.detachmentId);
    assert.ok(detachment, `Missing detachment ${row.detachmentId}`);
    assert.ok(realCatalog.factionKeywordById.has(row.factionKeywordId), `Missing detachment faction ${row.factionKeywordId}`);

    const valid = validateRoster({
      id: `${row.detachmentId}:${row.factionKeywordId}:allowed`,
      name: "Allowed Detachment",
      factionKeywordId: row.factionKeywordId,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [row.detachmentId],
      units: [],
    });
    assert.ok(
      !messageCodes(valid.messages).includes("roster.detachment_not_allowed"),
      `${detachment.name} should be allowed for ${realCatalog.factionKeywordById.get(row.factionKeywordId)?.name}`
    );
    assert.equal(valid.points.detachmentPoints, costForDetachment(row.detachmentId, row.factionKeywordId));
    allowedRows += 1;

    const controlFactionId = allFactionIds.find((factionId) => (
      factionId !== row.factionKeywordId
      && !rows.some((candidate) => (
        candidate.detachmentId === row.detachmentId && candidate.factionKeywordId === factionId
      ))
    ));
    assert.ok(controlFactionId, `Expected unavailable control faction for ${detachment.name}`);
    const invalid = validateRoster({
      id: `${row.detachmentId}:${controlFactionId}:unavailable`,
      name: "Unavailable Detachment",
      factionKeywordId: controlFactionId,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [row.detachmentId],
      units: [],
    });
    assert.ok(
      messageCodes(invalid.messages).includes("roster.detachment_not_allowed"),
      `${detachment.name} should reject control faction ${realCatalog.factionKeywordById.get(controlFactionId)?.name}`
    );
    unavailableControlRows += 1;

    const listedIds = availableDetachments(row.factionKeywordId).map((item) => item.id);
    if (detachment.isCombatPatrol) {
      assert.ok(!listedIds.includes(row.detachmentId), `${detachment.name} should stay hidden from standard Builder detachment list`);
      combatPatrolHiddenRows += 1;
    } else {
      assert.ok(listedIds.includes(row.detachmentId), `${detachment.name} should be listed for its configured faction`);
      listedRows += 1;
    }

    const override = realCatalog.detachmentFactionPointCosts.find((item) => (
      item.detachmentId === row.detachmentId && item.factionKeywordId === row.factionKeywordId
    ));
    if (override) {
      assert.equal(costForDetachment(row.detachmentId, row.factionKeywordId), override.detachmentPointsCost);
      overrideRows += 1;
    } else {
      assert.equal(costForDetachment(row.detachmentId, row.factionKeywordId), detachment.detachmentPointsCost);
      baseCostRows += 1;
    }
  }

  for (const link of realCatalog.detachmentForceDispositions) {
    const detachment = realCatalog.detachmentById.get(link.detachmentId);
    const disposition = realCatalog.forceDispositionById.get(link.forceDispositionId);
    assert.ok(detachment, `Missing disposition detachment ${link.detachmentId}`);
    assert.ok(disposition, `Missing force disposition ${link.forceDispositionId}`);
    assert.equal(detachmentDispositionName(detachment), disposition.name);
    dispositionCounts[disposition.name] = (dispositionCounts[disposition.name] || 0) + 1;
  }

  assert.equal(allowedRows, 457);
  assert.equal(unavailableControlRows, 457);
  assert.equal(listedRows, 433);
  assert.equal(combatPatrolHiddenRows, 24);
  assert.equal(overrideRows, 4);
  assert.equal(baseCostRows, 453);
  assert.deepEqual(dispositionCounts, {
    Disruption: 54,
    "Priority Assets": 60,
    "Purge the Foe": 78,
    Reconnaissance: 35,
    "Take and Hold": 63,
  });
});

test("all live datasheet faction rows drive native validation and availability", () => {
  state.catalog = realCatalog;
  const rows = realCatalog.datasheetFactionKeywords;
  const allFactionIds = [...new Set(rows.map((row) => row.factionKeywordId))];
  const listedDatasheetsByFactionId = new Map();
  let nativeRows = 0;
  let descendantBlockedRows = 0;
  let excludedRows = 0;
  let combatPatrolRows = 0;
  let listedRows = 0;
  let nativeNonCombatListedRows = 0;
  let unavailableControlRows = 0;
  let unavailableControlRejectedRows = 0;

  const listedDatasheetIds = (factionKeywordId) => {
    if (!listedDatasheetsByFactionId.has(factionKeywordId)) {
      listedDatasheetsByFactionId.set(
        factionKeywordId,
        new Set(availableDatasheets({
          factionKeywordId,
          battleSizeId: battleSizeNamed("Strike Force").id,
          detachmentIds: [],
          units: [],
        }).map((datasheet) => datasheet.id))
      );
    }
    return listedDatasheetsByFactionId.get(factionKeywordId);
  };

  assert.equal(rows.length, 1256);
  assert.equal(realCatalog.datasheets.length, 1142);
  assert.equal(new Set(rows.map((row) => row.datasheetId)).size, 1141);
  assert.equal(new Set(rows.map((row) => row.factionKeywordId)).size, 42);
  assert.equal(realCatalog.factionExcludedDatasheets.length, 23);

  for (const row of rows) {
    const datasheet = realCatalog.datasheetById.get(row.datasheetId);
    const faction = realCatalog.factionKeywordById.get(row.factionKeywordId);
    assert.ok(datasheet, `Missing datasheet ${row.datasheetId}`);
    assert.ok(faction, `Missing datasheet faction ${row.factionKeywordId}`);
    assert.ok(
      datasheetFactionIds(row.datasheetId).includes(row.factionKeywordId),
      `${datasheet.name} should expose ${faction.name} through datasheetFactionIds`
    );

    const isCombatPatrol = datasheetIsCombatPatrol(datasheet);
    const isNative = datasheetIsNativeToFaction(row.factionKeywordId, row.datasheetId);
    const isExcluded = factionExcludesDatasheet(row.factionKeywordId, row.datasheetId);
    const listedIds = listedDatasheetIds(row.factionKeywordId);
    const validation = validateRoster({
      id: `${row.factionKeywordId}:${row.datasheetId}:native-row`,
      name: "Datasheet Faction Row",
      factionKeywordId: row.factionKeywordId,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [],
      units: [rosterUnitFromDatasheetId(row.datasheetId, `${row.datasheetId}:native-row`)],
    });
    const codes = messageCodes(validation.messages);

    if (isCombatPatrol) {
      combatPatrolRows += 1;
      assert.ok(codes.includes("roster.combat_patrol_datasheet"), `${datasheet.name} should be rejected as Combat Patrol`);
      assert.ok(!listedIds.has(row.datasheetId), `${datasheet.name} should stay hidden from standard unit selection`);
    }
    if (isNative) {
      nativeRows += 1;
      assert.ok(!codes.includes("roster.unit_not_native"), `${datasheet.name} should be native to ${faction.name}`);
      assert.ok(!codes.includes("roster.faction_datasheet_not_allowed"), `${datasheet.name} should not be faction-excluded from ${faction.name}`);
      if (!isCombatPatrol) {
        assert.ok(listedIds.has(row.datasheetId), `${datasheet.name} should be listed for ${faction.name}`);
        listedRows += 1;
        nativeNonCombatListedRows += 1;
      }
    } else if (isExcluded) {
      excludedRows += 1;
      assert.ok(codes.includes("roster.faction_datasheet_not_allowed"), `${datasheet.name} should be excluded from ${faction.name}`);
      assert.ok(!listedIds.has(row.datasheetId), `${datasheet.name} should not be listed for excluded faction ${faction.name}`);
    } else {
      descendantBlockedRows += 1;
      assert.ok(codes.includes("roster.unit_not_native"), `${datasheet.name} should defer to its child faction instead of ${faction.name}`);
      assert.ok(!listedIds.has(row.datasheetId), `${datasheet.name} should not be listed for parent faction ${faction.name}`);
    }

    const controlFactionId = allFactionIds.find((factionKeywordId) => (
      factionKeywordId !== row.factionKeywordId
      && !datasheetIsNativeToFaction(factionKeywordId, row.datasheetId)
      && !factionExcludesDatasheet(factionKeywordId, row.datasheetId)
    ));
    assert.ok(controlFactionId, `Expected non-native control faction for ${datasheet.name}`);
    const controlValidation = validateRoster({
      id: `${controlFactionId}:${row.datasheetId}:non-native-control`,
      name: "Non Native Control",
      factionKeywordId: controlFactionId,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [],
      units: [rosterUnitFromDatasheetId(row.datasheetId, `${row.datasheetId}:non-native-control`)],
    });
    assert.ok(
      messageCodes(controlValidation.messages).includes("roster.unit_not_native"),
      `${datasheet.name} should reject control faction ${realCatalog.factionKeywordById.get(controlFactionId)?.name}`
    );
    unavailableControlRows += 1;
    if (!listedDatasheetIds(controlFactionId).has(row.datasheetId)) {
      unavailableControlRejectedRows += 1;
    }
  }

  assert.equal(nativeRows, 1140);
  assert.equal(descendantBlockedRows, 115);
  assert.equal(excludedRows, 1);
  assert.equal(combatPatrolRows, 122);
  assert.equal(listedRows, 1034);
  assert.equal(nativeNonCombatListedRows, 1034);
  assert.equal(unavailableControlRows, 1256);
  assert.equal(unavailableControlRejectedRows, 1256);
});

test("all live battle sizes drive roster points, detachment points, duplicate, and enhancement limits", () => {
  state.catalog = realCatalog;
  const battleSizes = realCatalog.battleSizes;
  const hereticFaction = factionNamed("Heretic Astartes");
  const hereticDetachmentRows = realCatalog.detachmentFactionKeywords
    .filter((row) => row.factionKeywordId === hereticFaction.id)
    .filter((row) => !realCatalog.detachmentById.get(row.detachmentId)?.isCombatPatrol)
    .sort((left, right) => (
      costForDetachment(right.detachmentId, hereticFaction.id) - costForDetachment(left.detachmentId, hereticFaction.id)
      || String(realCatalog.detachmentById.get(left.detachmentId)?.name || "")
        .localeCompare(String(realCatalog.detachmentById.get(right.detachmentId)?.name || ""))
    ));
  const enhancementNames = [
    "Throne Mechanicum of Skulls",
    "Blade of Celerity",
    "Putrid Carapace",
    "Warp-borne Stalker",
    "Mirror of Fates",
  ];

  assert.equal(battleSizes.length, 3);
  assert.deepEqual(
    battleSizes.map((size) => [
      size.name,
      size.pointsLimit,
      size.detachmentPointsLimit,
      size.duplicateUnitLimit,
      size.enhancementLimit,
    ]),
    [
      ["Incursion", 1000, 2, 2, 2],
      ["Strike Force", 2000, 3, 3, 4],
      ["Onslaught", 3000, 3, 3, 4],
    ]
  );

  for (const size of battleSizes) {
    const overPointsValidation = validateRoster({
      id: `${size.id}:over-points`,
      name: `${size.name} Over Points`,
      factionKeywordId: hereticFaction.id,
      battleSizeId: size.id,
      detachmentIds: [detachmentNamed("Pactbound Zealots").id],
      units: [rosterUnitRef("Chaos Warlord Titan", `${size.id}:chaos-warlord-titan`)],
    });
    assert.ok(
      overPointsValidation.points.total > size.pointsLimit,
      `${size.name} fixture should exceed its points limit`
    );
    assert.ok(messageCodes(overPointsValidation.messages).includes("roster.points_limit_exceeded"));

    const overDetachmentIds = [];
    let detachmentPoints = 0;
    for (const row of hereticDetachmentRows) {
      overDetachmentIds.push(row.detachmentId);
      detachmentPoints += costForDetachment(row.detachmentId, hereticFaction.id);
      if (detachmentPoints > size.detachmentPointsLimit) {
        break;
      }
    }
    assert.ok(detachmentPoints > size.detachmentPointsLimit, `${size.name} should have an over-DP fixture`);
    const overDetachmentValidation = validateRoster({
      id: `${size.id}:over-detachment-points`,
      name: `${size.name} Over Detachment Points`,
      factionKeywordId: hereticFaction.id,
      battleSizeId: size.id,
      detachmentIds: overDetachmentIds,
      units: [],
    });
    assert.ok(messageCodes(overDetachmentValidation.messages).includes("roster.detachment_points_limit_exceeded"));

    const duplicateValidation = validateRoster({
      id: `${size.id}:captain-duplicates`,
      name: `${size.name} Captain Duplicates`,
      factionKeywordId: factionNamed("Adeptus Astartes").id,
      battleSizeId: size.id,
      detachmentIds: [detachmentNamed("Gladius Task Force").id],
      units: Array.from({ length: size.duplicateUnitLimit + 1 }, (_, index) => enhancementTargetUnit({
        id: `${size.id}:captain-${index}`,
        datasheetName: "Captain",
        miniatureName: "Captain",
        factionNames: ["Adeptus Astartes"],
        isWarlord: index === 0,
      })),
    });
    assert.ok(messageCodes(duplicateValidation.messages).includes("roster.unit_limit_exceeded"));

    const enhancementMessages = [];
    validateEnhancements(
      {
        factionKeywordId: factionNamed("Chaos Knights").id,
        battleSizeId: size.id,
      },
      [detachmentNamed("Lords of Dread")],
      enhancementNames.slice(0, size.enhancementLimit + 1).map((name, index) => withMiniatureEnhancement(
        enhancementTargetUnit({
          id: `${size.id}:knight-${index}`,
          datasheetName: "Knight Desecrator",
          miniatureName: "Knight Desecrator",
          factionNames: ["Chaos Knights"],
        }),
        enhancementNamed(name, "Lords of Dread")
      )),
      enhancementMessages
    );
    assert.ok(messageCodes(enhancementMessages).includes("enhancement.roster_has_too_many_enhancements"));
  }
});

test("all live datasheet duplicate-limit and max-model rows have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  const standardDatasheets = [];
  const epicHeroDatasheets = [];
  const sixLimitDatasheets = [];
  const battlelineDatasheets = [];
  const dedicatedTransportDatasheets = [];
  const maxModelDatasheets = realCatalog.datasheets
    .filter((datasheet) => !datasheetIsCombatPatrol(datasheet))
    .filter((datasheet) => Number(datasheet.maxModelCount || 0) > 0);
  let validDuplicateRows = 0;
  let invalidDuplicateRows = 0;
  let validMaxModelRows = 0;
  let invalidMaxModelRows = 0;

  for (const datasheet of realCatalog.datasheets.filter((item) => !datasheetIsCombatPatrol(item))) {
    const keywords = datasheetKeywordNameSet(datasheet.id);
    if (keywords.has("Epic Hero")) {
      epicHeroDatasheets.push(datasheet);
    } else if (keywords.has("Battleline") || keywords.has("Dedicated Transport")) {
      sixLimitDatasheets.push(datasheet);
      if (keywords.has("Battleline")) {
        battlelineDatasheets.push(datasheet);
      }
      if (keywords.has("Dedicated Transport")) {
        dedicatedTransportDatasheets.push(datasheet);
      }
    } else {
      standardDatasheets.push(datasheet);
    }
  }

  assert.equal(realCatalog.datasheets.filter((datasheet) => !datasheetIsCombatPatrol(datasheet)).length, 1035);
  assert.equal(epicHeroDatasheets.length, 151);
  assert.equal(battlelineDatasheets.length, 61);
  assert.equal(dedicatedTransportDatasheets.length, 36);
  assert.equal(sixLimitDatasheets.length, 97);
  assert.equal(standardDatasheets.length, 787);
  assert.equal(maxModelDatasheets.length, 8);
  assert.deepEqual(
    maxModelDatasheets.map((datasheet) => [datasheet.name, datasheet.maxModelCount]),
    [
      ["Fortis Kill Team", 10],
      ["Paladin Squad", 10],
      ["Victrix Honour Guard", 6],
      ["Indomitor Kill Team", 10],
      ["Spectrus Kill Team", 10],
      ["Brotherhood Terminator Squad", 10],
      ["Talonstrike Kill Team", 10],
      ["Corsair Voidscarred", 10],
    ]
  );

  const duplicateValidation = (datasheet, count) => validateRoster({
    id: `${datasheet.id}:duplicates:${count}`,
    name: `${datasheet.name} Duplicates ${count}`,
    factionKeywordId: rosterFactionIdForDatasheet(datasheet.id),
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: Array.from({ length: count }, (_, index) => ({
      id: `${datasheet.id}:duplicate:${index}`,
      datasheetId: datasheet.id,
    })),
  });
  const assertDuplicateLimit = (datasheet, validCount, invalidCount) => {
    const valid = duplicateValidation(datasheet, validCount);
    assert.ok(
      !messageCodes(valid.messages).includes("roster.unit_limit_exceeded"),
      `${datasheet.name} should allow ${validCount} copies`
    );
    validDuplicateRows += 1;

    const invalid = duplicateValidation(datasheet, invalidCount);
    assert.ok(
      messageCodes(invalid.messages).includes("roster.unit_limit_exceeded"),
      `${datasheet.name} should reject ${invalidCount} copies`
    );
    invalidDuplicateRows += 1;
  };

  for (const datasheet of epicHeroDatasheets) {
    assertDuplicateLimit(datasheet, 1, 2);
  }
  for (const datasheet of sixLimitDatasheets) {
    assertDuplicateLimit(datasheet, 6, 7);
  }
  for (const datasheet of standardDatasheets) {
    assertDuplicateLimit(datasheet, 3, 4);
  }

  for (const datasheet of maxModelDatasheets) {
    const miniature = realCatalog.miniaturesByDatasheetId.get(datasheet.id)?.[0];
    assert.ok(miniature, `${datasheet.name} should have a miniature for max model coverage`);
    const rosterForCount = (count) => validateRoster({
      id: `${datasheet.id}:models:${count}`,
      name: `${datasheet.name} Models ${count}`,
      factionKeywordId: rosterFactionIdForDatasheet(datasheet.id),
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [],
      units: [{
        id: `${datasheet.id}:unit:${count}`,
        datasheetId: datasheet.id,
        miniatures: [{
          id: `${datasheet.id}:${miniature.id}:${count}`,
          rosterUnitMiniatureId: `${datasheet.id}:${miniature.id}:${count}`,
          miniatureId: miniature.id,
          count,
          wargear: {},
        }],
      }],
    });

    const valid = rosterForCount(datasheet.maxModelCount);
    assert.ok(
      !messageCodes(valid.messages).includes("unit.max_model_count_too_many_models"),
      `${datasheet.name} should allow ${datasheet.maxModelCount} models`
    );
    validMaxModelRows += 1;

    const invalid = rosterForCount(datasheet.maxModelCount + 1);
    assert.ok(
      messageCodes(invalid.messages).includes("unit.max_model_count_too_many_models"),
      `${datasheet.name} should reject ${datasheet.maxModelCount + 1} models`
    );
    invalidMaxModelRows += 1;
  }

  assert.equal(validDuplicateRows, 1035);
  assert.equal(invalidDuplicateRows, 1035);
  assert.equal(validMaxModelRows, 8);
  assert.equal(invalidMaxModelRows, 8);
});

test("all live unit composition rows have available, unavailable, and miniature-shape coverage", () => {
  state.catalog = realCatalog;
  const compositions = realCatalog.unitCompositions;
  const miniatureRows = realCatalog.unitCompositionMiniatures;
  const requiredFactionRows = realCatalog.compositionRequiredFactionKeywords;
  const requiredDetachmentRows = realCatalog.compositionRequiredDetachments;
  let availableRows = 0;
  let factionUnavailableRows = 0;
  let detachmentUnavailableRows = 0;
  let defaultRows = 0;
  let generatedMiniatureRows = 0;
  let minCountTotal = 0;
  let maxCountTotal = 0;

  assert.equal(compositions.length, 1516);
  assert.equal(miniatureRows.length, 2258);
  assert.equal(requiredFactionRows.length, 51);
  assert.equal(requiredDetachmentRows.length, 8);
  assert.equal(compositions.filter((composition) => composition.isDefault).length, 1195);
  assert.equal(compositions.filter((composition) => !composition.isDefault).length, 321);

  for (const composition of compositions) {
    const rows = compositionMiniatureRows(composition);
    const factionRows = compositionRequiredFactionRows(composition);
    const detachmentRows = compositionRequiredDetachmentRows(composition);
    const factionIds = factionRows.length ? factionScope(factionRows[0].factionKeywordId) : [];
    const detachmentIds = detachmentRows.length ? [detachmentRows[0].detachmentId] : [];

    assert.ok(rows.length, `Expected composition ${composition.id} to have miniature rows`);
    assert.ok(realCatalog.datasheetById.has(composition.datasheetId), `Missing composition datasheet ${composition.datasheetId}`);
    assert.ok(
      availableCompositionIds(composition, factionIds, detachmentIds).includes(composition.id),
      `Expected composition ${composition.id} to be available when requirements are satisfied`
    );
    availableRows += 1;

    if (composition.isDefault) {
      defaultRows += 1;
    }
    if (factionRows.length) {
      assert.ok(
        !availableCompositionIds(composition, [], detachmentIds).includes(composition.id),
        `Expected faction-scoped composition ${composition.id} to be unavailable without its faction`
      );
      factionUnavailableRows += factionRows.length;
    }
    if (detachmentRows.length) {
      assert.ok(
        !availableCompositionIds(composition, factionIds, []).includes(composition.id),
        `Expected detachment-scoped composition ${composition.id} to be unavailable without its detachment`
      );
      detachmentUnavailableRows += detachmentRows.length;
    }

    const generatedMiniatures = defaultMiniaturesForComposition(composition);
    const generatedByMiniatureId = new Map(generatedMiniatures.map((miniature) => [miniature.miniatureId, miniature]));
    assert.equal(generatedMiniatures.length, rows.length, `Miniature row count mismatch for composition ${composition.id}`);

    for (const row of rows) {
      const miniature = realCatalog.miniatureById.get(row.miniatureId);
      assert.ok(miniature, `Missing composition miniature ${row.miniatureId}`);
      assert.equal(miniature.datasheetId, composition.datasheetId, `Composition miniature ${row.miniatureId} is outside datasheet ${composition.datasheetId}`);
      assert.ok(Number(row.min || 0) <= Number(row.max || 0), `Composition ${composition.id} has min above max`);
      assert.equal(
        generatedByMiniatureId.get(row.miniatureId)?.count,
        Number(row.min || 0),
        `Expected defaultMiniatures to use min count for ${composition.id}/${row.miniatureId}`
      );
      generatedMiniatureRows += 1;
      minCountTotal += Number(row.min || 0);
      maxCountTotal += Number(row.max || 0);
    }
  }

  assert.equal(availableRows, 1516);
  assert.equal(factionUnavailableRows, 51);
  assert.equal(detachmentUnavailableRows, 8);
  assert.equal(defaultRows, 1195);
  assert.equal(generatedMiniatureRows, 2258);
  assert.equal(minCountTotal, 4933);
  assert.equal(maxCountTotal, 5759);
});

test("all live datasheet points steps apply from the configured duplicate position", () => {
  state.catalog = realCatalog;
  const rows = realCatalog.datasheetPointsSteps;
  let beforeThresholdRows = 0;
  let appliedThresholdRows = 0;
  let appliedStepPointsTotal = 0;

  assert.equal(rows.length, 334);
  assert.equal(rows.filter((row) => Number(row.stepAt || 0) === 2).length, 95);
  assert.equal(rows.filter((row) => Number(row.stepAt || 0) === 3).length, 234);
  assert.equal(rows.filter((row) => Number(row.stepAt || 0) === 4).length, 5);
  assert.equal(new Set(rows.map((row) => row.datasheetId)).size, 334);

  for (const row of rows) {
    assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing points-step datasheet ${row.datasheetId}`);
    assert.ok(Number(row.stepAt || 0) > 1, `Expected duplicate stepAt above first copy for ${row.datasheetId}`);
    assert.ok(Number(row.stepPoints || 0) > 0, `Expected positive step points for ${row.datasheetId}`);

    const summaries = unitSummariesForPointsStep(row);
    assert.equal(summaries.length, Number(row.stepAt || 0) + 1);
    for (const [index, summary] of summaries.entries()) {
      const position = index + 1;
      if (position < Number(row.stepAt || 0)) {
        assert.equal(summary.datasheetPointsStep, 0, `Expected no step points before ${row.stepAt} for ${row.datasheetId}`);
        beforeThresholdRows += 1;
      } else {
        assert.equal(
          summary.datasheetPointsStep,
          Number(row.stepPoints || 0),
          `Expected step points at duplicate position ${position} for ${row.datasheetId}`
        );
        appliedThresholdRows += 1;
        appliedStepPointsTotal += summary.datasheetPointsStep;
      }
    }
  }

  assert.equal(beforeThresholdRows, 578);
  assert.equal(appliedThresholdRows, 668);
  assert.equal(appliedStepPointsTotal, 10790);
});

test("detachment and composition validators cover unique, excluded, linked, and invalid composition cases", () => {
  state.catalog = realCatalog;

  const uniqueMessages = [];
  validateDetachmentUniqueKeywords([
    detachmentNamed("Kabalite Agonysts"),
    detachmentNamed("Kabalite Cartel"),
  ], uniqueMessages);
  assert.ok(messageCodes(uniqueMessages).includes("roster.detachment_unique_keyword_error"));

  withCatalog({
    detachmentUniqueKeywordsByDetachmentId: new Map([
      ["detachment-a", [{ keywordId: "keyword-a" }]],
      ["detachment-b", [{ keywordId: "keyword-b" }]],
      ["detachment-c", [{ keywordId: "keyword-a" }]],
    ]),
    keywordById: new Map([
      ["keyword-a", { id: "keyword-a", name: "Shared Display Name" }],
      ["keyword-b", { id: "keyword-b", name: "Shared Display Name" }],
    ]),
  }, () => {
    const sameNameMessages = [];
    validateDetachmentUniqueKeywords([
      { id: "detachment-a", name: "Detachment A" },
      { id: "detachment-b", name: "Detachment B" },
    ], sameNameMessages);
    assert.ok(!messageCodes(sameNameMessages).includes("roster.detachment_unique_keyword_error"));

    const sameIdMessages = [];
    validateDetachmentUniqueKeywords([
      { id: "detachment-a", name: "Detachment A" },
      { id: "detachment-c", name: "Detachment C" },
    ], sameIdMessages);
    assert.ok(messageCodes(sameIdMessages).includes("roster.detachment_unique_keyword_error"));
  });

  const shadowLegion = detachmentNamed("Shadow Legion");
  const excludedRow = realCatalog.detachmentExcludedDatasheets.find((row) => (
    row.detachmentId === shadowLegion.id
    && realCatalog.datasheetById.get(row.datasheetId)?.name === "Kairos Fateweaver"
  ));
  assert.ok(excludedRow, "Expected Shadow Legion to exclude Kairos Fateweaver");
  const excludedMessages = [];
  validateDetachmentDatasheets(
    [shadowLegion],
    [rosterUnitFromDatasheetId(excludedRow.datasheetId, "kairos")],
    excludedMessages
  );
  assert.ok(messageCodes(excludedMessages).includes("detachment.datasheet_not_allowed"));

  const purgeCorps = detachmentNamed("Purge Corps Deltic-9");
  const linkedMessages = [];
  validateDetachmentDatasheets(
    [purgeCorps],
    [enhancementTargetUnit({
      id: "wrong-combat-patrol-unit",
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
    })],
    linkedMessages
  );
  assert.ok(messageCodes(linkedMessages).includes("detachment.linked_datasheet_count_mismatch"));
  assert.ok(messageCodes(linkedMessages).includes("detachment.linked_datasheet_not_allowed"));

  const compositionMessages = [];
  validateUnitCompositions([
    { id: "too-many", name: "Too Many", modelCount: 11, maxModelCount: 10, selectedCompositionId: "composition", selectedCompositionAvailable: true },
    { id: "missing-composition", name: "Missing Composition", modelCount: 1, maxModelCount: 10, selectedCompositionId: "", selectedCompositionAvailable: false },
    { id: "unavailable-composition", name: "Unavailable Composition", modelCount: 1, maxModelCount: 10, selectedCompositionId: "composition", selectedCompositionAvailable: false },
  ], compositionMessages);
  assert.ok(messageCodes(compositionMessages).includes("unit.max_model_count_too_many_models"));
  assert.ok(messageCodes(compositionMessages).includes("unit_composition.invalid_unit_composition"));
  assert.ok(messageCodes(compositionMessages).includes("unit_composition.unavailable"));

  withCatalog({
    detachmentExcludedDatasheets: [],
    detachmentRequiredDatasheetsByDetachmentId: new Map([[
      "required-detachment",
      [{ datasheetId: "required-datasheet" }],
    ]]),
    datasheetById: new Map([["required-datasheet", { id: "required-datasheet", name: "Required Datasheet" }]]),
  }, () => {
    const requiredDatasheetMessages = [];
    validateDetachmentDatasheets(
      [{ id: "required-detachment", name: "Required Detachment", isCombatPatrol: false }],
      [],
      requiredDatasheetMessages
    );
    assert.ok(messageCodes(requiredDatasheetMessages).includes("detachment.datasheets_missing"));

    const selectedRequiredDatasheetMessages = [];
    validateDetachmentDatasheets(
      [{ id: "required-detachment", name: "Required Detachment", isCombatPatrol: false }],
      [{ id: "required-unit", name: "Required Datasheet", datasheetId: "required-datasheet" }],
      selectedRequiredDatasheetMessages
    );
    assert.ok(!messageCodes(selectedRequiredDatasheetMessages).includes("detachment.datasheets_missing"));
  });
});

test("all live detachment unique keyword groups have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.detachmentUniqueKeywords.length, 57);

  const rowsByKeywordId = new Map();
  for (const row of realCatalog.detachmentUniqueKeywords) {
    if (!rowsByKeywordId.has(row.keywordId)) {
      rowsByKeywordId.set(row.keywordId, []);
    }
    rowsByKeywordId.get(row.keywordId).push(row);
  }
  assert.equal(rowsByKeywordId.size, 27);

  const representatives = [];
  for (const [keywordId, rows] of rowsByKeywordId.entries()) {
    assert.ok(rows.length > 1, `${keywordId} should be a shared unique detachment keyword`);
    const detachments = rows.map((row) => realCatalog.detachmentById.get(row.detachmentId));
    assert.ok(detachments.every(Boolean), `${keywordId} should resolve all detachments`);

    representatives.push(detachments[0]);

    const invalidMessages = [];
    validateDetachmentUniqueKeywords(detachments, invalidMessages);
    assert.ok(
      messageCodes(invalidMessages).includes("roster.detachment_unique_keyword_error"),
      `${keywordId} should reject detachments sharing one unique keyword`
    );
  }

  const validMessages = [];
  validateDetachmentUniqueKeywords(representatives, validMessages);
  assert.ok(!messageCodes(validMessages).includes("roster.detachment_unique_keyword_error"));
});

test("all live datasheet exclusion rows have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.detachmentExcludedDatasheets.length, 23);
  assert.equal(realCatalog.factionExcludedDatasheets.length, 23);

  const detachmentExcludedIds = new Map();
  for (const row of realCatalog.detachmentExcludedDatasheets) {
    if (!detachmentExcludedIds.has(row.detachmentId)) {
      detachmentExcludedIds.set(row.detachmentId, new Set());
    }
    detachmentExcludedIds.get(row.detachmentId).add(row.datasheetId);

    const messages = [];
    validateDetachmentDatasheets(
      [realCatalog.detachmentById.get(row.detachmentId)],
      [rosterUnitFromDatasheetId(row.datasheetId, `${row.detachmentId}:${row.datasheetId}:excluded`)],
      messages
    );
    assert.ok(
      messageCodes(messages).includes("detachment.datasheet_not_allowed"),
      `${row.detachmentId}:${row.datasheetId} should be excluded from its detachment`
    );
  }
  for (const [detachmentId, excludedIds] of detachmentExcludedIds.entries()) {
    const allowedDatasheet = realCatalog.datasheets.find((datasheet) => !excludedIds.has(datasheet.id));
    assert.ok(allowedDatasheet, `${detachmentId} should have a non-excluded control datasheet`);
    const messages = [];
    validateDetachmentDatasheets(
      [realCatalog.detachmentById.get(detachmentId)],
      [rosterUnitFromDatasheetId(allowedDatasheet.id, `${detachmentId}:allowed`)],
      messages
    );
    assert.ok(!messageCodes(messages).includes("detachment.datasheet_not_allowed"));
  }

  const factionExcludedIds = new Map();
  for (const row of realCatalog.factionExcludedDatasheets) {
    if (!factionExcludedIds.has(row.factionKeywordId)) {
      factionExcludedIds.set(row.factionKeywordId, new Set());
    }
    factionExcludedIds.get(row.factionKeywordId).add(row.datasheetId);

    const detachmentRow = realCatalog.detachmentFactionKeywords.find((item) => {
      const detachment = realCatalog.detachmentById.get(item.detachmentId);
      return item.factionKeywordId === row.factionKeywordId && detachment && !detachment.isCombatPatrol;
    });
    assert.ok(detachmentRow, `${row.factionKeywordId} should have a non-Combat Patrol detachment`);
    const validation = validateRoster({
      id: `${row.factionKeywordId}:${row.datasheetId}:excluded`,
      name: "Excluded Datasheet",
      factionKeywordId: row.factionKeywordId,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [detachmentRow.detachmentId],
      units: [{ id: `${row.datasheetId}:unit`, datasheetId: row.datasheetId }],
    });
    assert.ok(
      messageCodes(validation.messages).includes("roster.faction_datasheet_not_allowed"),
      `${row.factionKeywordId}:${row.datasheetId} should be excluded from its roster faction`
    );
  }
  for (const [factionKeywordId, excludedIds] of factionExcludedIds.entries()) {
    const allowedDatasheet = realCatalog.datasheets.find((datasheet) => (
      !excludedIds.has(datasheet.id)
      && !realCatalog.publicationById.get(datasheet.publicationId)?.isCombatPatrol
      && (realCatalog.datasheetFactionKeywordsByDatasheetId.get(datasheet.id) || [])
        .some((row) => row.factionKeywordId === factionKeywordId)
    ));
    assert.ok(allowedDatasheet, `${factionKeywordId} should have a native non-excluded control datasheet`);
    const detachmentRow = realCatalog.detachmentFactionKeywords.find((item) => {
      const detachment = realCatalog.detachmentById.get(item.detachmentId);
      return item.factionKeywordId === factionKeywordId && detachment && !detachment.isCombatPatrol;
    });
    const validation = validateRoster({
      id: `${factionKeywordId}:${allowedDatasheet.id}:allowed`,
      name: "Allowed Datasheet",
      factionKeywordId,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [detachmentRow.detachmentId],
      units: [{ id: `${allowedDatasheet.id}:unit`, datasheetId: allowedDatasheet.id }],
    });
    assert.ok(!messageCodes(validation.messages).includes("roster.faction_datasheet_not_allowed"));
  }
});

test("all live Combat Patrol linked datasheet rows have exact roster coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.detachmentLinkedDatasheets.length, 107);

  const rowsByDetachmentId = new Map();
  for (const row of realCatalog.detachmentLinkedDatasheets) {
    if (!rowsByDetachmentId.has(row.detachmentId)) {
      rowsByDetachmentId.set(row.detachmentId, []);
    }
    rowsByDetachmentId.get(row.detachmentId).push(row);
  }
  assert.equal(rowsByDetachmentId.size, 24);

  for (const [detachmentId, linkedRows] of rowsByDetachmentId.entries()) {
    const detachment = realCatalog.detachmentById.get(detachmentId);
    assert.ok(detachment?.isCombatPatrol, `${detachmentId} should be a Combat Patrol detachment`);
    const linkedIds = new Set(linkedRows.map((row) => row.datasheetId));
    const exactUnits = linkedRows.flatMap((row) => (
      Array.from({ length: row.count }, (_, index) => (
        rosterUnitFromDatasheetId(row.datasheetId, `${detachmentId}:${row.datasheetId}:exact-${index}`)
      ))
    ));

    const exactMessages = [];
    validateDetachmentDatasheets([detachment], exactUnits, exactMessages);
    assert.ok(
      !messageCodes(exactMessages).some((code) => code.startsWith("detachment.linked_datasheet_")),
      `${detachment.name} exact linked roster should be valid`
    );

    const missingMessages = [];
    validateDetachmentDatasheets([detachment], exactUnits.slice(1), missingMessages);
    assert.ok(
      messageCodes(missingMessages).includes("detachment.linked_datasheet_count_mismatch"),
      `${detachment.name} should reject missing linked datasheets`
    );

    const extraDatasheet = realCatalog.datasheets.find((datasheet) => !linkedIds.has(datasheet.id));
    assert.ok(extraDatasheet, `${detachment.name} should have a non-linked control datasheet`);
    const extraMessages = [];
    validateDetachmentDatasheets(
      [detachment],
      [...exactUnits, rosterUnitFromDatasheetId(extraDatasheet.id, `${detachmentId}:extra`)],
      extraMessages
    );
    assert.ok(
      messageCodes(extraMessages).includes("detachment.linked_datasheet_not_allowed"),
      `${detachment.name} should reject non-linked datasheets`
    );
  }
});

test("validateRoster reports roster-level detachment, points, Combat Patrol, native, and excluded datasheet failures", () => {
  state.catalog = realCatalog;

  const illegalDetachmentValidation = validateRoster({
    id: "illegal-detachment",
    name: "Illegal Detachment",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Kabalite Agonysts").id],
    units: [],
  });
  assert.ok(messageCodes(illegalDetachmentValidation.messages).includes("roster.detachment_not_allowed"));

  const pointsValidation = validateRoster({
    id: "over-points",
    name: "Over Points",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Incursion").id,
    detachmentIds: [detachmentNamed("Pactbound Zealots").id],
    units: [rosterUnitRef("Chaos Warlord Titan", "chaos-warlord-titan")],
  });
  assert.ok(messageCodes(pointsValidation.messages).includes("roster.points_limit_exceeded"));

  const steppedDatasheet = datasheetNamed("Eradicator Squad");
  const steppedComposition = defaultCompositionForDatasheet(steppedDatasheet.id);
  const steppedPoints = realCatalog.datasheetPointsStepsByDatasheetId.get(steppedDatasheet.id)?.[0];
  assert.ok(steppedPoints, "Expected Eradicator Squad to have a datasheet points step");
  const steppedPointsValidation = validateRoster({
    id: "stepped-points",
    name: "Stepped Points",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [0, 1, 2].map((index) => rosterUnitRef("Eradicator Squad", `eradicator-${index}`)),
  });
  assert.equal(
    steppedPointsValidation.points.total,
    (steppedComposition.points * 3) + steppedPoints.stepPoints
  );

  const combatPatrolDatasheet = combatPatrolDatasheetNamed("Assault Force Intercessor Squad");
  const combatPatrolValidation = validateRoster({
    id: "combat-patrol-unit",
    name: "Combat Patrol Unit",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Incursion").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [{ id: "assault-force-intercessors", datasheetId: combatPatrolDatasheet.id }],
  });
  assert.ok(messageCodes(combatPatrolValidation.messages).includes("roster.combat_patrol_datasheet"));

  const nonNativeValidation = validateRoster({
    id: "non-native",
    name: "Non Native",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [rosterUnitRef("Plague Marines", "plague-marines")],
  });
  assert.ok(messageCodes(nonNativeValidation.messages).includes("roster.unit_not_native"));

  const excludedValidation = validateRoster({
    id: "black-templars-librarian",
    name: "Black Templars Librarian",
    factionKeywordId: factionNamed("Black Templars").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [rosterUnitRef("Librarian", "librarian")],
  });
  assert.ok(messageCodes(excludedValidation.messages).includes("roster.faction_datasheet_not_allowed"));
});

test("default unit composition prefers matching detachment and faction specific rows", () => {
  state.catalog = realCatalog;

  const genericCtanValidation = validateRoster({
    id: "generic-void-dragon",
    name: "Generic Void Dragon",
    factionKeywordId: factionNamed("Necrons").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Hypercrypt Legion").id],
    units: [rosterUnitRef("C’tan Shard of the Void Dragon", "generic-void-dragon")],
  });
  assert.equal(genericCtanValidation.points.total, 345);

  const pantheonCtanValidation = validateRoster({
    id: "pantheon-void-dragon",
    name: "Pantheon Void Dragon",
    factionKeywordId: factionNamed("Necrons").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Pantheon of Woe").id],
    units: [rosterUnitRef("C’tan Shard of the Void Dragon", "pantheon-void-dragon")],
  });
  assert.equal(pantheonCtanValidation.points.total, 380);

  const voidDragon = datasheetNamed("C’tan Shard of the Void Dragon");
  const genericVoidDragonComposition = (realCatalog.compositionsByDatasheetId.get(voidDragon.id) || [])
    .find((composition) => !(realCatalog.requiredDetachmentsByCompositionId.get(composition.id) || []).length);
  assert.ok(genericVoidDragonComposition, "Expected generic Void Dragon composition");
  const savedGenericPantheonValidation = validateRoster({
    id: "saved-generic-pantheon-void-dragon",
    name: "Saved Generic Pantheon Void Dragon",
    factionKeywordId: factionNamed("Necrons").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Pantheon of Woe").id],
    units: [{
      ...rosterUnitRef("C’tan Shard of the Void Dragon", "saved-generic-pantheon-void-dragon"),
      compositionId: genericVoidDragonComposition.id,
    }],
  });
  assert.equal(savedGenericPantheonValidation.points.total, 380);

  const genericBladeguardValidation = validateRoster({
    id: "generic-bladeguard",
    name: "Generic Bladeguard",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [rosterUnitRef("Bladeguard Veteran Squad", "generic-bladeguard")],
  });
  assert.equal(genericBladeguardValidation.points.total, 80);

  const bloodAngelsBladeguardValidation = validateRoster({
    id: "blood-angels-bladeguard",
    name: "Blood Angels Bladeguard",
    factionKeywordId: factionNamed("Blood Angels").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Liberator Assault Group").id],
    units: [rosterUnitRef("Bladeguard Veteran Squad", "blood-angels-bladeguard")],
  });
  assert.equal(bloodAngelsBladeguardValidation.points.total, 85);

  const bladeguard = datasheetNamed("Bladeguard Veteran Squad");
  const genericBladeguardComposition = (realCatalog.compositionsByDatasheetId.get(bladeguard.id) || [])
    .find((composition) => !(realCatalog.requiredFactionKeywordsByCompositionId.get(composition.id) || []).length);
  assert.ok(genericBladeguardComposition, "Expected generic Bladeguard composition");
  const savedGenericBloodAngelsValidation = validateRoster({
    id: "saved-generic-blood-angels-bladeguard",
    name: "Saved Generic Blood Angels Bladeguard",
    factionKeywordId: factionNamed("Blood Angels").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Liberator Assault Group").id],
    units: [{
      ...rosterUnitRef("Bladeguard Veteran Squad", "saved-generic-blood-angels-bladeguard"),
      compositionId: genericBladeguardComposition.id,
    }],
  });
  assert.equal(savedGenericBloodAngelsValidation.points.total, 85);

  const assaultJumpPack = datasheetNamed("Assault Intercessors with Jump Packs");
  const genericLargeAssaultJumpPackComposition = (realCatalog.compositionsByDatasheetId.get(assaultJumpPack.id) || [])
    .find((composition) => (
      !composition.isDefault
      && !(realCatalog.requiredFactionKeywordsByCompositionId.get(composition.id) || []).length
      && !(realCatalog.requiredDetachmentsByCompositionId.get(composition.id) || []).length
      && composition.displayOrder === 2
    ));
  assert.ok(genericLargeAssaultJumpPackComposition, "Expected generic large Assault Intercessors with Jump Packs composition");
  assert.equal(genericLargeAssaultJumpPackComposition.points, 160);
  const savedGenericLargeBloodAngelsValidation = validateRoster({
    id: "saved-generic-large-blood-angels-assault-jump-pack",
    name: "Saved Generic Large Blood Angels Assault Intercessors with Jump Packs",
    factionKeywordId: factionNamed("Blood Angels").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Liberator Assault Group").id],
    units: [{
      ...rosterUnitRef("Assault Intercessors with Jump Packs", "saved-generic-large-blood-angels-assault-jump-pack"),
      compositionId: genericLargeAssaultJumpPackComposition.id,
    }],
  });
  assert.equal(savedGenericLargeBloodAngelsValidation.points.total, 180);

  const bloodAngelsAssaultJumpPackOptions = availableCompositions(
    assaultJumpPack.id,
    factionScope(factionNamed("Blood Angels").id),
    [detachmentNamed("Liberator Assault Group").id]
  );
  assert.deepEqual(
    bloodAngelsAssaultJumpPackOptions.map((composition) => composition.points),
    [95, 180]
  );
  assert.ok(bloodAngelsAssaultJumpPackOptions.every((composition) => (
    realCatalog.requiredFactionKeywordsByCompositionId.get(composition.id) || []
  ).some((row) => row.factionKeywordId === factionNamed("Blood Angels").id)));
});

test("validateRoster enforces duplicate datasheet limits for non-Battleline and Epic Heroes", () => {
  state.catalog = realCatalog;
  const rosterBase = {
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
  };

  const captainValidation = validateRoster({
    ...rosterBase,
    id: "captain-duplicates",
    name: "Captain Duplicates",
    units: [0, 1, 2, 3].map((index) => enhancementTargetUnit({
      id: `captain-${index}`,
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
      isWarlord: index === 0,
    })),
  });
  assert.ok(messageCodes(captainValidation.messages).includes("roster.unit_limit_exceeded"));

  const guillimanValidation = validateRoster({
    ...rosterBase,
    id: "epic-duplicates",
    name: "Epic Duplicates",
    units: [0, 1].map((index) => enhancementTargetUnit({
      id: `guilliman-${index}`,
      datasheetName: "Roboute Guilliman",
      miniatureName: "Roboute Guilliman",
      factionNames: ["Adeptus Astartes", "Ultramarines"],
      isWarlord: index === 0,
    })),
  });
  assert.ok(messageCodes(guillimanValidation.messages).includes("roster.unit_limit_exceeded"));

  const houndpackBase = {
    factionKeywordId: factionNamed("Chaos Knights").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Houndpack Lance").id],
  };
  const battlelineWarDogValidation = validateRoster({
    ...houndpackBase,
    id: "battleline-war-dog-duplicates",
    name: "Battleline War Dog Duplicates",
    units: [0, 1, 2, 3].map((index) => rosterUnitRef("War Dog Brigand", `war-dog-brigand-${index}`)),
  });
  assert.ok(!messageCodes(battlelineWarDogValidation.messages).includes("roster.unit_limit_exceeded"));

  const tooManyBattlelineWarDogsValidation = validateRoster({
    ...houndpackBase,
    id: "too-many-battleline-war-dog-duplicates",
    name: "Too Many Battleline War Dog Duplicates",
    units: [0, 1, 2, 3, 4, 5, 6].map((index) => rosterUnitRef("War Dog Brigand", `too-many-war-dog-brigand-${index}`)),
  });
  assert.ok(messageCodes(tooManyBattlelineWarDogsValidation.messages).includes("roster.unit_limit_exceeded"));
});

test("keyword restriction groups are inherited through roster faction parent scope", () => {
  const catalog = {
    factionKeywordById: new Map([
      ["child-faction", { id: "child-faction", name: "Child", parentFactionKeywordId: "parent-faction" }],
      ["parent-faction", { id: "parent-faction", name: "Parent", parentFactionKeywordId: "" }],
    ]),
    keywordById: new Map([["restricted-keyword", { id: "restricted-keyword", name: "Restricted" }]]),
    keywordRestrictionGroupsByFactionId: new Map([
      ["parent-faction", [{
        id: "parent-group",
        factionKeywordId: "parent-faction",
        limit: 0,
        excludedFactionKeywordId: "",
        requiresWarlordMiniatureId: "",
      }]],
    ]),
    keywordRestrictionGroups: [],
    keywordRestrictionGroupKeywordsByGroupId: new Map([
      ["parent-group", [{ keywordId: "restricted-keyword" }]],
    ]),
    restrictionGroupDetachmentLimitsByDetachmentId: new Map(),
  };
  withCatalog(catalog, () => {
    const messages = [];
    validateKeywordRestrictions({ factionKeywordId: "child-faction" }, [], [{
      id: "restricted-unit",
      name: "Restricted Unit",
      keywordIds: ["restricted-keyword"],
      factionKeywordIds: ["child-faction"],
      warlordMiniatureIds: [],
    }], messages);
    assert.ok(messageCodes(messages).includes("keyword_restriction_group.limit_zero"));
  });
});
