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
    assert.deepEqual(
      overDetachmentValidation.messages.find((message) => message.code === "roster.detachment_points_limit_exceeded")?.scope?.detachmentIds,
      overDetachmentIds
    );

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
