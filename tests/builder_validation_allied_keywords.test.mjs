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

test("all live legacy allied restricting keyword rows have invalid and paired coverage", () => {
  state.catalog = realCatalog;
  const legacyRestrictingKeywords = realCatalog.keywords
    .filter((keyword) => keyword.allyRestrictingKeywordId);
  assert.equal(legacyRestrictingKeywords.length, 4);

  for (const [index, keyword] of legacyRestrictingKeywords.entries()) {
    const alliedFactionId = alliedFactionForRestrictingKeyword(keyword);
    const restrictedOnlyDatasheet = datasheetForAlliedKeywordPresence(
      alliedFactionId,
      keyword.id,
      keyword.allyRestrictingKeywordId
    );
    const restrictingDatasheet = datasheetForAlliedKeywordIds(
      alliedFactionId,
      [keyword.id, keyword.allyRestrictingKeywordId]
    );
    const roster = {
      factionKeywordId: firstRosterFactionForAlliedFaction(alliedFactionId),
      battleSizeId: battleSizeNamed("Strike Force").id,
    };

    const invalidMessages = [];
    validateAlliedUnits(roster, [], [
      catalogAlliedUnit({
        id: `legacy-restricting-keyword-${index}-invalid`,
        alliedFactionId,
        datasheet: restrictedOnlyDatasheet,
        points: 0,
      }),
    ], invalidMessages);
    assert.ok(
      messageCodes(invalidMessages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"),
      `${keyword.name} should require enough matching restricting-keyword allies`
    );

    const pairedMessages = [];
    validateAlliedUnits(roster, [], [
      catalogAlliedUnit({
        id: `legacy-restricting-keyword-${index}-restricted`,
        alliedFactionId,
        datasheet: restrictedOnlyDatasheet,
        points: 0,
      }),
      catalogAlliedUnit({
        id: `legacy-restricting-keyword-${index}-restricting`,
        alliedFactionId,
        datasheet: restrictingDatasheet,
        points: 0,
      }),
    ], pairedMessages);
    assert.ok(
      !messageCodes(pairedMessages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"),
      `${keyword.name} should pass once a matching restricting-keyword ally is present`
    );
  }
});

test("all live allied faction keyword limits have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.alliedFactionKeywords.length, 54);
  assert.equal(realCatalog.alliedFactionKeywords.filter((row) => row.requiredWarlordMiniatureId).length, 0);

  for (const [index, row] of realCatalog.alliedFactionKeywords.entries()) {
    const roster = {
      factionKeywordId: firstRosterFactionForAlliedFaction(row.alliedFactionId),
      battleSizeId: row.battleSizeId,
    };

    const atLimitMessages = [];
    validateAlliedUnits(
      roster,
      [],
      alliedKeywordUnits(row, row.limitCount, `allied-keyword-${index}-at-limit`),
      atLimitMessages
    );
    assert.ok(
      !messageCodes(atLimitMessages).includes("allied_keyword_count.limit_exceeded"),
      `allied_faction_keyword row ${index} should allow exactly ${row.limitCount} matching units`
    );

    const overLimitMessages = [];
    validateAlliedUnits(
      roster,
      [],
      alliedKeywordUnits(row, row.limitCount + 1, `allied-keyword-${index}-over-limit`),
      overLimitMessages
    );
    assert.ok(
      messageCodes(overLimitMessages).includes("allied_keyword_count.limit_exceeded"),
      `allied_faction_keyword row ${index} should reject ${row.limitCount + 1} matching units`
    );
  }
});

test("data-empty allied faction keyword required warlord limits stay covered", () => {
  assert.equal(realCatalog.alliedFactionKeywords.filter((row) => row.requiredWarlordMiniatureId).length, 0);

  const gatedRow = {
    id: "warlord-gated-keyword-limit",
    alliedFactionId: "ally",
    keywordId: "limited-keyword",
    limitCount: 1,
    requiredWarlordMiniatureId: "required-warlord",
    battleSizeId: "strike",
  };
  const catalog = {
    factionAlliedFactionsByFactionId: new Map([["roster-faction", [{ alliedFactionId: "ally" }]]]),
    alliedFactionParentsByAlliedFactionId: new Map([["ally", [{ factionKeywordId: "ally-parent" }]]]),
    alliedFactionById: new Map([["ally", {}]]),
    alliedFactionDatasheetsByAlliedFactionId: new Map([["ally", [{ datasheetId: "allowed-datasheet" }]]]),
    alliedFactionPointsLimitsByAlliedFactionId: new Map(),
    alliedFactionKeywordsByAlliedFactionId: new Map([["ally", [gatedRow]]]),
    alliedFactionAllowedWarlordsByAlliedFactionId: new Map(),
    alliedFactionRequiredDetachmentsByAlliedFactionId: new Map(),
    alliedFactionAllegianceAbilitiesByAlliedFactionId: new Map(),
    alliedFactionKeywordSlotlessGroupsByKeywordId: new Map(),
    alliedFactionKeywordSlotlessDonorsByGroupId: new Map(),
    alliedFactionKeywordSlotlessReceiversByGroupId: new Map(),
    keywordAllyRestrictingKeywords: [],
    keywords: [],
    keywordById: new Map([["limited-keyword", { id: "limited-keyword", name: "Limited Keyword" }]]),
    miniatureById: new Map([["required-warlord", { id: "required-warlord", name: "Required Warlord" }]]),
    detachmentById: new Map(),
    factionById: new Map([["roster-faction", { id: "roster-faction", name: "Roster Faction" }]]),
    factionKeywordById: new Map([["ally-parent", { id: "ally-parent", name: "Ally Parent" }]]),
    battleSizeById: new Map([["strike", { id: "strike", name: "Strike Force" }]]),
    allegianceAbilityById: new Map(),
    allegianceAbilityGroupById: new Map(),
  };
  const roster = { factionKeywordId: "roster-faction", battleSizeId: "strike" };
  const alliedUnits = (count, warlordIndex = -1) => Array.from({ length: count }, (_, index) => ({
    id: `ally-unit-${index}`,
    name: `Ally Unit ${index}`,
    allyType: "ally",
    datasheetId: "allowed-datasheet",
    keywordIds: ["limited-keyword"],
    points: 0,
    warlordMiniatureIds: index === warlordIndex ? ["required-warlord"] : [],
  }));

  withCatalog(catalog, () => {
    const skippedMessages = [];
    validateAlliedUnits(roster, [], alliedUnits(2), skippedMessages);
    assert.ok(!messageCodes(skippedMessages).includes("allied_keyword_count.limit_exceeded"));

    const atLimitMessages = [];
    validateAlliedUnits(roster, [], alliedUnits(1, 0), atLimitMessages);
    assert.ok(!messageCodes(atLimitMessages).includes("allied_keyword_count.limit_exceeded"));

    const overLimitMessages = [];
    validateAlliedUnits(roster, [], alliedUnits(2, 0), overLimitMessages);
    assert.ok(messageCodes(overLimitMessages).includes("allied_keyword_count.limit_exceeded"));
  });
});

test("all live mutually exclusive allied keyword buckets reject mixed active keyword groups", () => {
  state.catalog = realCatalog;
  const mutuallyExclusiveBuckets = [];
  for (const [alliedFactionId, rows] of realCatalog.alliedFactionKeywordsByAlliedFactionId.entries()) {
    if (!realCatalog.alliedFactionById.get(alliedFactionId)?.isMutuallyExclusiveKeywordLimit) {
      continue;
    }
    const rowsByBattleSize = new Map();
    for (const row of rows) {
      const battleRows = rowsByBattleSize.get(row.battleSizeId) || [];
      battleRows.push(row);
      rowsByBattleSize.set(row.battleSizeId, battleRows);
    }
    for (const [battleSizeId, battleRows] of rowsByBattleSize.entries()) {
      if (new Set(battleRows.map((row) => row.keywordId)).size > 1) {
        mutuallyExclusiveBuckets.push({ alliedFactionId, battleSizeId, battleRows });
      }
    }
  }
  assert.equal(mutuallyExclusiveBuckets.length, 12);

  for (const [index, bucket] of mutuallyExclusiveBuckets.entries()) {
    const rowsByKeyword = new Map();
    for (const row of bucket.battleRows) {
      if (!rowsByKeyword.has(row.keywordId)) {
        rowsByKeyword.set(row.keywordId, row);
      }
    }
    const [firstRow, secondRow] = [...rowsByKeyword.values()];
    const messages = [];
    validateAlliedUnits(
      {
        factionKeywordId: firstRosterFactionForAlliedFaction(bucket.alliedFactionId),
        battleSizeId: bucket.battleSizeId,
      },
      [],
      [
        ...alliedKeywordUnits(firstRow, 1, `mutually-exclusive-${index}-a`),
        ...alliedKeywordUnits(secondRow, 1, `mutually-exclusive-${index}-b`),
      ],
      messages
    );
    assert.ok(
      messageCodes(messages).includes("allied_keyword_count.invalid_mutually_exclusive_keywords"),
      `mutually exclusive allied keyword bucket ${index} should reject mixed active keyword groups`
    );
  }
});

test("all live allied slotless keyword groups reduce receiver keyword counts", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.alliedFactionKeywordSlotlessKeywordGroups.length, 12);

  for (const [index, group] of realCatalog.alliedFactionKeywordSlotlessKeywordGroups.entries()) {
    const row = realCatalog.alliedFactionKeywords.find((item) => item.id === group.alliedFactionKeywordId);
    assert.ok(row, `Expected allied_faction_keyword ${group.alliedFactionKeywordId}`);
    const donorKeywordIds = (realCatalog.alliedFactionKeywordSlotlessDonorsByGroupId.get(group.id) || [])
      .map((item) => item.keywordId);
    const receiverKeywordIds = (realCatalog.alliedFactionKeywordSlotlessReceiversByGroupId.get(group.id) || [])
      .map((item) => item.keywordId);
    assert.ok(donorKeywordIds.length, `Expected donor keywords for slotless group ${group.id}`);
    assert.ok(receiverKeywordIds.length, `Expected receiver keywords for slotless group ${group.id}`);
    const donorDatasheet = datasheetForAlliedKeywordIds(row.alliedFactionId, donorKeywordIds);
    const receiverDatasheet = datasheetForAlliedKeywordIds(row.alliedFactionId, receiverKeywordIds);
    const receiverUnits = Array.from({ length: row.limitCount + 1 }, (_, receiverIndex) => catalogAlliedUnit({
      id: `slotless-${index}-receiver-${receiverIndex}`,
      alliedFactionId: row.alliedFactionId,
      datasheet: receiverDatasheet,
      points: 0,
    }));

    const overLimitMessages = [];
    validateAlliedUnits(
      {
        factionKeywordId: firstRosterFactionForAlliedFaction(row.alliedFactionId),
        battleSizeId: row.battleSizeId,
      },
      [],
      receiverUnits,
      overLimitMessages
    );
    assert.ok(
      messageCodes(overLimitMessages).includes("allied_keyword_count.limit_exceeded"),
      `slotless group ${index} should exceed the receiver keyword cap without a donor`
    );

    const slotlessMessages = [];
    validateAlliedUnits(
      {
        factionKeywordId: firstRosterFactionForAlliedFaction(row.alliedFactionId),
        battleSizeId: row.battleSizeId,
      },
      [],
      [
        catalogAlliedUnit({
          id: `slotless-${index}-donor`,
          alliedFactionId: row.alliedFactionId,
          datasheet: donorDatasheet,
          points: 0,
        }),
        ...receiverUnits,
      ],
      slotlessMessages
    );
    assert.ok(
      !messageCodes(slotlessMessages).includes("allied_keyword_count.limit_exceeded"),
      `slotless group ${index} should subtract the paired donor from receiver keyword count`
    );
  }
});

test("new-table ally restricting keyword rows respect keyword faction scope when present", () => {
  const baseCatalog = {
    factionAlliedFactionsByFactionId: new Map([["roster-faction", [{ alliedFactionId: "ally" }]]]),
    alliedFactionParentsByAlliedFactionId: new Map([["ally", [{ factionKeywordId: "matching-parent" }]]]),
    keywordAllyRestrictingKeywords: [{ keywordId: "restricted-keyword", restrictingKeywordId: "restricting-keyword" }],
    keywordById: new Map([
      ["restricted-keyword", {
        id: "restricted-keyword",
        name: "Restricted",
        allyRestrictingFactionKeywordId: "other-parent",
      }],
      ["restricting-keyword", { id: "restricting-keyword", name: "Restricting" }],
    ]),
    keywords: [],
    alliedFactionById: new Map([["ally", {}]]),
    alliedFactionDatasheetsByAlliedFactionId: new Map([["ally", [{ datasheetId: "d1" }, { datasheetId: "d2" }]]]),
    alliedFactionPointsLimitsByAlliedFactionId: new Map(),
    alliedFactionKeywordsByAlliedFactionId: new Map(),
    alliedFactionAllowedWarlordsByAlliedFactionId: new Map(),
    alliedFactionRequiredDetachmentsByAlliedFactionId: new Map(),
    alliedFactionAllegianceAbilitiesByAlliedFactionId: new Map(),
    alliedFactionKeywordSlotlessGroupsByKeywordId: new Map(),
    alliedFactionKeywordSlotlessDonorsByGroupId: new Map(),
    alliedFactionKeywordSlotlessReceiversByGroupId: new Map(),
    miniatureById: new Map(),
    detachmentById: new Map(),
    factionById: new Map([["roster-faction", { id: "roster-faction", name: "Roster Faction" }]]),
    factionKeywordById: new Map([["matching-parent", { id: "matching-parent", name: "Matching Parent" }]]),
    battleSizeById: new Map(),
    allegianceAbilityById: new Map(),
    allegianceAbilityGroupById: new Map(),
  };
  const roster = { factionKeywordId: "roster-faction", battleSizeId: "strike" };
  const alliedUnits = [
    { id: "u1", name: "Unit 1", allyType: "ally", datasheetId: "d1", keywordIds: ["restricted-keyword"], points: 10, warlordMiniatureIds: [] },
    { id: "u2", name: "Unit 2", allyType: "ally", datasheetId: "d2", keywordIds: ["restricted-keyword"], points: 10, warlordMiniatureIds: [] },
  ];

  withCatalog(baseCatalog, () => {
    const messages = [];
    validateAlliedUnits(roster, [], alliedUnits, messages);
    assert.ok(!messageCodes(messages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"));
  });

  const matchingCatalog = {
    ...baseCatalog,
    keywordById: new Map([
      ["restricted-keyword", {
        id: "restricted-keyword",
        name: "Restricted",
        allyRestrictingFactionKeywordId: "matching-parent",
      }],
      ["restricting-keyword", { id: "restricting-keyword", name: "Restricting" }],
    ]),
  };
  withCatalog(matchingCatalog, () => {
    const messages = [];
    validateAlliedUnits(roster, [], alliedUnits, messages);
    assert.ok(messageCodes(messages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"));
  });
});

test("ally restricting keyword rows match allied parent faction ancestry", () => {
  const baseCatalog = {
    factionAlliedFactionsByFactionId: new Map([["roster-faction", [{ alliedFactionId: "ally" }]]]),
    alliedFactionParentsByAlliedFactionId: new Map([["ally", [{ factionKeywordId: "matching-child" }]]]),
    keywordAllyRestrictingKeywords: [{ keywordId: "restricted-keyword", restrictingKeywordId: "restricting-keyword" }],
    keywordById: new Map([
      ["restricted-keyword", {
        id: "restricted-keyword",
        name: "Restricted",
        allyRestrictingFactionKeywordId: "matching-parent",
      }],
      ["restricting-keyword", { id: "restricting-keyword", name: "Restricting" }],
    ]),
    keywords: [],
    alliedFactionById: new Map([["ally", {}]]),
    alliedFactionDatasheetsByAlliedFactionId: new Map([["ally", [{ datasheetId: "d1" }, { datasheetId: "d2" }]]]),
    alliedFactionPointsLimitsByAlliedFactionId: new Map(),
    alliedFactionKeywordsByAlliedFactionId: new Map(),
    alliedFactionAllowedWarlordsByAlliedFactionId: new Map(),
    alliedFactionRequiredDetachmentsByAlliedFactionId: new Map(),
    alliedFactionAllegianceAbilitiesByAlliedFactionId: new Map(),
    alliedFactionKeywordSlotlessGroupsByKeywordId: new Map(),
    alliedFactionKeywordSlotlessDonorsByGroupId: new Map(),
    alliedFactionKeywordSlotlessReceiversByGroupId: new Map(),
    miniatureById: new Map(),
    detachmentById: new Map(),
    factionById: new Map([["roster-faction", { id: "roster-faction", name: "Roster Faction" }]]),
    factionKeywordById: new Map([
      ["matching-parent", { id: "matching-parent", name: "Matching Parent" }],
      ["matching-child", { id: "matching-child", name: "Matching Child", parentFactionKeywordId: "matching-parent" }],
    ]),
    battleSizeById: new Map(),
    allegianceAbilityById: new Map(),
    allegianceAbilityGroupById: new Map(),
  };
  const roster = { factionKeywordId: "roster-faction", battleSizeId: "strike" };
  const alliedUnits = [
    { id: "u1", name: "Unit 1", allyType: "ally", datasheetId: "d1", keywordIds: ["restricted-keyword"], points: 10, warlordMiniatureIds: [] },
    { id: "u2", name: "Unit 2", allyType: "ally", datasheetId: "d2", keywordIds: ["restricted-keyword"], points: 10, warlordMiniatureIds: [] },
  ];

  withCatalog(baseCatalog, () => {
    const messages = [];
    validateAlliedUnits(roster, [], alliedUnits, messages);
    assert.ok(messageCodes(messages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"));
  });

  const childOnlyRestrictionCatalog = {
    ...baseCatalog,
    alliedFactionParentsByAlliedFactionId: new Map([["ally", [{ factionKeywordId: "matching-parent" }]]]),
    keywordById: new Map([
      ["restricted-keyword", {
        id: "restricted-keyword",
        name: "Restricted",
        allyRestrictingFactionKeywordId: "matching-child",
      }],
      ["restricting-keyword", { id: "restricting-keyword", name: "Restricting" }],
    ]),
  };
  withCatalog(childOnlyRestrictionCatalog, () => {
    const messages = [];
    validateAlliedUnits(roster, [], alliedUnits, messages);
    assert.ok(!messageCodes(messages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"));
  });
});
