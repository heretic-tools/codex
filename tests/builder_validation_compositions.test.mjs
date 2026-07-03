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
  compositionMiniatureRows,
  compositionRequiredDetachmentRows,
  compositionRequiredFactionRows,
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
