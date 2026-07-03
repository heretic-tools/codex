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
  firstRosterFactionForAlliedFaction,
  firstRosterFactionWithoutAlliedFaction,
  alliedFactionForRestrictingKeyword,
  firstDatasheetForAlliedFaction,
  firstDatasheetOutsideAlliedFaction,
  datasheetForAlliedKeywordIds,
  datasheetForAlliedKeywordPresence,
  datasheetForMiniature,
  catalogAlliedUnit,
  alliedKeywordUnits,
} from "./builder_validation_allied_helpers.mjs";

test("all live allied rule tables stay pinned to explicit coverage counts", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.alliedFactions.length, 21);
  assert.equal(realCatalog.factionKeywordAlliedFactions.length, 87);
  assert.equal(realCatalog.alliedFactionParentFactionKeywords.length, 25);
  assert.equal(realCatalog.alliedFactionDatasheets.length, 320);
  assert.equal(realCatalog.alliedFactionPointsLimits.length, 39);
  assert.equal(realCatalog.alliedFactionKeywords.length, 54);
  assert.equal(realCatalog.alliedFactionAllowedWarlordMiniatures.length, 28);
  assert.equal(realCatalog.alliedFactionRequiredDetachments.length, 29);
  assert.equal(realCatalog.alliedFactionAllegianceAbilities.length, 0);
  assert.equal(realCatalog.alliedFactionKeywordSlotlessKeywordGroups.length, 12);
  assert.equal(realCatalog.alliedFactionKeywordSlotlessDonorKeywords.length, 18);
  assert.equal(realCatalog.alliedFactionKeywordSlotlessReceiverKeywords.length, 12);
  assert.equal(realCatalog.keywordAllyRestrictingKeywords.length, 0);
  assert.equal(realCatalog.keywords.filter((keyword) => keyword.allyRestrictingKeywordId).length, 4);
});

test("allied validation ignores rosters without allied units", () => {
  const messages = [];
  validateAlliedUnits(
    { factionKeywordId: factionNamed("Adeptus Astartes").id, battleSizeId: battleSizeNamed("Strike Force").id },
    [],
    [{
      id: "native-captain",
      name: "Captain",
      allyType: "native",
      datasheetId: datasheetNamed("Captain").id,
      keywordIds: keywordIdsForDatasheet(datasheetNamed("Captain").id),
      points: 0,
      warlordMiniatureIds: [],
    }],
    messages
  );
  assert.deepEqual(messages, []);
});

test("Heretic Astartes Legiones Daemonica allies enforce points and restricting keyword caps", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const allyType = alliedFactionWithParent("Legiones Daemonica");

  const underCapMessages = [];
  validateAlliedUnits(roster, [], [
    alliedUnit({ id: "daemon-points-under-cap", datasheetName: "Bloodletters", allyType, points: 500 }),
  ], underCapMessages);
  assert.ok(!messageCodes(underCapMessages).includes("allied_points.limit_exceeded"));

  const pointsMessages = [];
  validateAlliedUnits(roster, [], [
    alliedUnit({ id: "daemon-points-over-cap", datasheetName: "Bloodletters", allyType, points: 501 }),
  ], pointsMessages);
  assert.ok(messageCodes(pointsMessages).includes("allied_points.limit_exceeded"));

  const restrictingCases = [
    { id: "khorne-daemon-outnumbering", battleline: "Bloodletters", nonBattleline: "Bloodmaster" },
    { id: "nurgle-daemon-outnumbering", battleline: "Plaguebearers", nonBattleline: "Poxbringer" },
    { id: "slaanesh-daemon-outnumbering", battleline: "Daemonettes", nonBattleline: "Infernal Enrapturess" },
    { id: "tzeentch-daemon-outnumbering", battleline: "Pink Horrors", nonBattleline: "Changecaster" },
  ];
  for (const parityCase of restrictingCases) {
    const restrictingMessages = [];
    validateAlliedUnits(roster, [], [
      alliedUnit({ id: `${parityCase.id}-invalid`, datasheetName: parityCase.nonBattleline, allyType, points: 100 }),
    ], restrictingMessages);
    assert.ok(
      messageCodes(restrictingMessages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"),
      `${parityCase.id} should require enough matching Battleline allies`
    );

    const pairedMessages = [];
    validateAlliedUnits(roster, [], [
      alliedUnit({ id: `${parityCase.id}-battleline`, datasheetName: parityCase.battleline, allyType, points: 100 }),
      alliedUnit({ id: `${parityCase.id}-non-battleline`, datasheetName: parityCase.nonBattleline, allyType, points: 100 }),
    ], pairedMessages);
    assert.ok(
      !messageCodes(pairedMessages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"),
      `${parityCase.id} should pass once matching Battleline allies are not outnumbered`
    );
  }
});

test("Heretic Astartes Chaos Knights allies enforce keyword caps and mutual exclusion", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const allyType = alliedFactionWithParent("Chaos Knights");

  const capMessages = [];
  validateAlliedUnits(roster, [], [
    alliedUnit({ id: "brigand-1", datasheetName: "War Dog Brigand", allyType, points: 100 }),
    alliedUnit({ id: "brigand-2", datasheetName: "War Dog Brigand", allyType, points: 100 }),
    alliedUnit({ id: "brigand-3", datasheetName: "War Dog Brigand", allyType, points: 100 }),
    alliedUnit({ id: "brigand-4", datasheetName: "War Dog Brigand", allyType, points: 100 }),
  ], capMessages);
  assert.ok(messageCodes(capMessages).includes("allied_keyword_count.limit_exceeded"));

  const mutualMessages = [];
  validateAlliedUnits(roster, [], [
    alliedUnit({ id: "brigand", datasheetName: "War Dog Brigand", allyType, points: 100 }),
    alliedUnit({ id: "rampager", datasheetName: "Knight Rampager", allyType, points: 100 }),
  ], mutualMessages);
  assert.ok(messageCodes(mutualMessages).includes("allied_keyword_count.invalid_mutually_exclusive_keywords"));
});

test("Heretic Astartes Titanicus Traitoris allies enforce titan keyword caps", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const allyType = alliedFactionWithParent("Titanicus Traitoris");
  const messages = [];
  validateAlliedUnits(roster, [], [
    alliedUnit({ id: "warhound-1", datasheetName: "Chaos Warhound Titan", allyType, points: 100 }),
    alliedUnit({ id: "warhound-2", datasheetName: "Chaos Warhound Titan", allyType, points: 100 }),
  ], messages);
  assert.ok(messageCodes(messages).includes("allied_keyword_count.limit_exceeded"));
});
