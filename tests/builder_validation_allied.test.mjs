import assert from "node:assert/strict";
import test from "node:test";
import {
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
  datasheetIdForEnhancementBodyguard
} from "./builder_validation_helpers.mjs";

function firstRosterFactionForAlliedFaction(alliedFactionId) {
  const row = realCatalog.factionKeywordAlliedFactions.find((item) => item.alliedFactionId === alliedFactionId);
  assert.ok(row, `Expected roster faction for allied faction ${alliedFactionId}`);
  return row.factionKeywordId;
}

function firstRosterFactionWithoutAlliedFaction(alliedFactionId) {
  const faction = realCatalog.factionKeywords.find((candidate) => !(
    realCatalog.factionAlliedFactionsByFactionId.get(candidate.id) || []
  ).some((row) => row.alliedFactionId === alliedFactionId));
  assert.ok(faction, `Expected roster faction without allied faction ${alliedFactionId}`);
  return faction.id;
}

function firstDatasheetForAlliedFaction(alliedFactionId) {
  const row = (realCatalog.alliedFactionDatasheetsByAlliedFactionId.get(alliedFactionId) || [])[0];
  assert.ok(row, `Expected datasheet for allied faction ${alliedFactionId}`);
  const datasheet = realCatalog.datasheetById.get(row.datasheetId);
  assert.ok(datasheet, `Expected datasheet ${row.datasheetId}`);
  return datasheet;
}

function datasheetForAlliedKeywordIds(alliedFactionId, keywordIds) {
  const datasheet = (realCatalog.alliedFactionDatasheetsByAlliedFactionId.get(alliedFactionId) || [])
    .map((row) => realCatalog.datasheetById.get(row.datasheetId))
    .filter(Boolean)
    .find((item) => keywordIds.every((keywordId) => keywordIdsForDatasheet(item.id).includes(keywordId)));
  assert.ok(datasheet, `Expected allied datasheet for ${alliedFactionId} with keywords ${keywordIds.join(", ")}`);
  return datasheet;
}

function datasheetForMiniature(miniatureId) {
  const miniature = realCatalog.miniatureById.get(miniatureId);
  assert.ok(miniature, `Expected miniature ${miniatureId}`);
  const datasheet = realCatalog.datasheetById.get(miniature.datasheetId);
  assert.ok(datasheet, `Expected datasheet for miniature ${miniatureId}`);
  return datasheet;
}

function catalogAlliedUnit({
  id,
  alliedFactionId,
  points,
  datasheet = firstDatasheetForAlliedFaction(alliedFactionId),
  warlordMiniatureIds = [],
}) {
  return {
    id,
    name: datasheet.name,
    datasheetId: datasheet.id,
    allyType: alliedFactionId,
    keywordIds: keywordIdsForDatasheet(datasheet.id),
    points,
    warlordMiniatureIds,
  };
}

function alliedKeywordUnits(row, count, idPrefix) {
  const datasheet = datasheetForAlliedKeywordIds(row.alliedFactionId, [row.keywordId]);
  return Array.from({ length: count }, (_, index) => catalogAlliedUnit({
    id: `${idPrefix}-${index}`,
    alliedFactionId: row.alliedFactionId,
    datasheet,
    points: 0,
    warlordMiniatureIds: index === 0 && row.requiredWarlordMiniatureId
      ? [row.requiredWarlordMiniatureId]
      : [],
  }));
}

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

test("all live allied faction keyword limits have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.alliedFactionKeywords.length, 54);

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

test("Heretic Astartes cult legion allies require one configured detachment", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const allyType = alliedFactionWithParent("Death Guard");
  const plagueMarines = alliedUnit({ id: "plague-marines", datasheetName: "Plague Marines", allyType, points: 100 });

  const missingMessages = [];
  validateAlliedUnits(roster, [], [plagueMarines], missingMessages);
  assert.ok(messageCodes(missingMessages).includes("allied_unit.required_detachment_not_selected"));

  const selectedMessages = [];
  validateAlliedUnits(roster, [detachmentNamed("Pactbound Zealots")], [plagueMarines], selectedMessages);
  assert.ok(!messageCodes(selectedMessages).includes("allied_unit.required_detachment_not_selected"));
});

test("Heretic Astartes cult legion ally bucket covers Death Guard, Thousand Sons, World Eaters, and Emperor's Children", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const cases = [
    ["Death Guard", "Plague Marines"],
    ["Thousand Sons", "Rubric Marines"],
    ["World Eaters", "Khorne Berzerkers"],
    ["Emperor’s Children", "Noise Marines"],
  ];
  for (const [parentName, datasheetName] of cases) {
    const allyType = alliedFactionWithParent(parentName);
    const messages = [];
    validateAlliedUnits(roster, [], [
      alliedUnit({ id: `${parentName}:${datasheetName}`, datasheetName, allyType, points: 100 }),
    ], messages);
    assert.ok(
      messageCodes(messages).includes("allied_unit.required_detachment_not_selected"),
      `${parentName} should require a configured Heretic Astartes detachment`
    );
  }
});

test("all live allied required detachment rows have missing and selected coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.alliedFactionRequiredDetachments.length, 29);

  for (const [index, row] of realCatalog.alliedFactionRequiredDetachments.entries()) {
    const roster = {
      factionKeywordId: firstRosterFactionForAlliedFaction(row.alliedFactionId),
      battleSizeId: battleSizeNamed("Strike Force").id,
    };
    const detachment = realCatalog.detachmentById.get(row.detachmentId);
    assert.ok(detachment, `Expected detachment ${row.detachmentId}`);
    const unit = catalogAlliedUnit({
      id: `allied-required-detachment-${index}`,
      alliedFactionId: row.alliedFactionId,
      points: 0,
    });

    const missingMessages = [];
    validateAlliedUnits(roster, [], [unit], missingMessages);
    assert.ok(
      messageCodes(missingMessages).includes("allied_unit.required_detachment_not_selected"),
      `allied_faction_required_detachment row ${index} should require ${detachment.name}`
    );

    const selectedMessages = [];
    validateAlliedUnits(roster, [detachment], [unit], selectedMessages);
    assert.ok(
      !messageCodes(selectedMessages).includes("allied_unit.required_detachment_not_selected"),
      `allied_faction_required_detachment row ${index} should be satisfied by ${detachment.name}`
    );
  }
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

test("all live allied faction points limits have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.alliedFactionPointsLimits.length, 39);

  for (const [index, row] of realCatalog.alliedFactionPointsLimits.entries()) {
    const roster = {
      factionKeywordId: firstRosterFactionForAlliedFaction(row.alliedFactionId),
      battleSizeId: row.battleSizeId,
    };

    const atLimitMessages = [];
    validateAlliedUnits(roster, [], [
      catalogAlliedUnit({
        id: `allied-points-${index}-at-limit`,
        alliedFactionId: row.alliedFactionId,
        points: row.pointsLimit,
      }),
    ], atLimitMessages);
    assert.ok(
      !messageCodes(atLimitMessages).includes("allied_points.limit_exceeded"),
      `allied_faction_points_limit row ${index} should allow exactly ${row.pointsLimit} points`
    );

    const overLimitMessages = [];
    validateAlliedUnits(roster, [], [
      catalogAlliedUnit({
        id: `allied-points-${index}-over-limit`,
        alliedFactionId: row.alliedFactionId,
        points: row.pointsLimit + 1,
      }),
    ], overLimitMessages);
    assert.ok(
      messageCodes(overLimitMessages).includes("allied_points.limit_exceeded"),
      `allied_faction_points_limit row ${index} should reject ${row.pointsLimit + 1} points`
    );
  }
});

test("all live faction allied faction rows have available and unavailable coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.factionKeywordAlliedFactions.length, 87);

  for (const [index, row] of realCatalog.factionKeywordAlliedFactions.entries()) {
    const unit = catalogAlliedUnit({
      id: `faction-ally-available-${index}`,
      alliedFactionId: row.alliedFactionId,
      points: 0,
    });

    const availableMessages = [];
    validateAlliedUnits(
      {
        factionKeywordId: row.factionKeywordId,
        battleSizeId: battleSizeNamed("Strike Force").id,
      },
      [],
      [unit],
      availableMessages
    );
    assert.ok(
      !messageCodes(availableMessages).includes("allied_faction.not_available"),
      `faction_keyword_allied_faction row ${index} should make its ally bucket available`
    );

    const unavailableMessages = [];
    validateAlliedUnits(
      {
        factionKeywordId: firstRosterFactionWithoutAlliedFaction(row.alliedFactionId),
        battleSizeId: battleSizeNamed("Strike Force").id,
      },
      [],
      [unit],
      unavailableMessages
    );
    assert.ok(
      messageCodes(unavailableMessages).includes("allied_faction.not_available"),
      `faction_keyword_allied_faction row ${index} should still reject a faction without that ally bucket`
    );
  }
});

test("all live allied allowed warlord rows have missing and selected coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.alliedFactionAllowedWarlordMiniatures.length, 28);

  for (const [index, row] of realCatalog.alliedFactionAllowedWarlordMiniatures.entries()) {
    const roster = {
      factionKeywordId: firstRosterFactionForAlliedFaction(row.alliedFactionId),
      battleSizeId: battleSizeNamed("Strike Force").id,
    };

    const missingMessages = [];
    validateAlliedUnits(roster, [], [
      catalogAlliedUnit({
        id: `allied-allowed-warlord-${index}-missing`,
        alliedFactionId: row.alliedFactionId,
        points: 0,
      }),
    ], missingMessages);
    assert.ok(
      messageCodes(missingMessages).includes("allied_units.required_warlord_missing"),
      `allied_faction_allowed_warlord_miniature row ${index} should require an allowed Warlord`
    );

    const selectedMessages = [];
    validateAlliedUnits(roster, [], [
      catalogAlliedUnit({
        id: `allied-allowed-warlord-${index}-selected`,
        alliedFactionId: row.alliedFactionId,
        datasheet: datasheetForMiniature(row.miniatureId),
        points: 0,
        warlordMiniatureIds: [row.miniatureId],
      }),
    ], selectedMessages);
    assert.ok(
      !messageCodes(selectedMessages).includes("allied_units.required_warlord_missing"),
      `allied_faction_allowed_warlord_miniature row ${index} should accept its configured Warlord miniature`
    );
  }
});

test("Agents of the Imperium allies enforce allowed warlords and slotless Retinue pairs", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const allyType = alliedFactionForRosterAndParent("Adeptus Astartes", "Agents of the Imperium");

  const missingWarlordMessages = [];
  validateAlliedUnits(roster, [], [
    alliedUnit({ id: "agents", datasheetName: "Inquisitorial Agents", allyType, points: 50 }),
  ], missingWarlordMessages);
  assert.ok(messageCodes(missingWarlordMessages).includes("allied_units.required_warlord_missing"));

  const watchMaster = alliedUnitWarlord(
    alliedUnit({ id: "watch-master", datasheetName: "Watch Master", allyType, points: 50 }),
    "Watch Master"
  );
  const retinueUnits = [
    alliedUnit({ id: "agents", datasheetName: "Inquisitorial Agents", allyType, points: 50 }),
    alliedUnit({ id: "exaction", datasheetName: "Exaction Squad", allyType, points: 50 }),
    alliedUnit({ id: "vigilant", datasheetName: "Vigilant Squad", allyType, points: 50 }),
  ];
  const overLimitMessages = [];
  validateAlliedUnits(roster, [], [watchMaster, ...retinueUnits], overLimitMessages);
  assert.ok(messageCodes(overLimitMessages).includes("allied_keyword_count.limit_exceeded"));

  const inquisitorDraxus = alliedUnitWarlord(
    alliedUnit({ id: "draxus", datasheetName: "Inquisitor Draxus", allyType, points: 50 }),
    "Inquisitor Draxus"
  );
  const slotlessMessages = [];
  validateAlliedUnits(roster, [], [inquisitorDraxus, ...retinueUnits], slotlessMessages);
  assert.ok(!messageCodes(slotlessMessages).includes("allied_keyword_count.limit_exceeded"));
  assert.ok(!messageCodes(slotlessMessages).includes("allied_units.required_warlord_missing"));
});

test("allied units reject unavailable ally buckets, disallowed datasheets, and required allegiance misses", () => {
  state.catalog = realCatalog;
  const adeptusRoster = {
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };

  const chaosKnightsAlly = alliedFactionWithParent("Chaos Knights");
  const unavailableMessages = [];
  validateAlliedUnits(adeptusRoster, [], [
    alliedUnit({ id: "brigand", datasheetName: "War Dog Brigand", allyType: chaosKnightsAlly, points: 100 }),
  ], unavailableMessages);
  assert.ok(messageCodes(unavailableMessages).includes("allied_faction.not_available"));

  const agentsAlly = alliedFactionForRosterAndParent("Adeptus Astartes", "Agents of the Imperium");
  const captain = datasheetNamed("Captain");
  const disallowedMessages = [];
  validateAlliedUnits(adeptusRoster, [], [{
    id: "captain-as-agent",
    name: "Captain",
    allyType: agentsAlly,
    datasheetId: captain.id,
    keywordIds: keywordIdsForDatasheet(captain.id),
    points: 80,
    warlordMiniatureIds: [],
  }], disallowedMessages);
  assert.ok(messageCodes(disallowedMessages).includes("allied_faction.datasheet_not_allowed"));

  const requiredAbility = {
    id: "required-ability",
    name: "Required Ability",
    allegianceAbilityGroupId: "required-group",
  };
  const catalog = {
    factionAlliedFactionsByFactionId: new Map([["roster-faction", [{ alliedFactionId: "ally" }]]]),
    alliedFactionParentsByAlliedFactionId: new Map([["ally", [{ factionKeywordId: "ally-parent" }]]]),
    alliedFactionById: new Map([["ally", {}]]),
    alliedFactionDatasheetsByAlliedFactionId: new Map([["ally", [{ datasheetId: "allowed-datasheet" }]]]),
    alliedFactionPointsLimitsByAlliedFactionId: new Map(),
    alliedFactionKeywordsByAlliedFactionId: new Map(),
    alliedFactionAllowedWarlordsByAlliedFactionId: new Map(),
    alliedFactionRequiredDetachmentsByAlliedFactionId: new Map(),
    alliedFactionAllegianceAbilitiesByAlliedFactionId: new Map([[
      "ally",
      [{ allegianceAbilityId: requiredAbility.id }],
    ]]),
    alliedFactionKeywordSlotlessGroupsByKeywordId: new Map(),
    alliedFactionKeywordSlotlessDonorsByGroupId: new Map(),
    alliedFactionKeywordSlotlessReceiversByGroupId: new Map(),
    keywordAllyRestrictingKeywords: [],
    keywords: [],
    keywordById: new Map(),
    miniatureById: new Map(),
    detachmentById: new Map(),
    factionById: new Map([["roster-faction", { id: "roster-faction", name: "Roster Faction" }]]),
    factionKeywordById: new Map([["ally-parent", { id: "ally-parent", name: "Ally Parent" }]]),
    battleSizeById: new Map(),
    allegianceAbilityById: new Map([[requiredAbility.id, requiredAbility]]),
    allegianceAbilityGroupById: new Map([["required-group", { id: "required-group", name: "Required Group" }]]),
  };
  withCatalog(catalog, () => {
    const missingAbilityMessages = [];
    validateAlliedUnits(
      { factionKeywordId: "roster-faction", battleSizeId: "strike" },
      [],
      [{
        id: "ally-unit",
        name: "Ally Unit",
        allyType: "ally",
        datasheetId: "allowed-datasheet",
        keywordIds: [],
        points: 10,
        warlordMiniatureIds: [],
        allegianceAbilities: [],
      }],
      missingAbilityMessages
    );
    assert.ok(messageCodes(missingAbilityMessages).includes("allied_unit.required_allegiance_ability_missing"));

    const selectedAbilityMessages = [];
    validateAlliedUnits(
      { factionKeywordId: "roster-faction", battleSizeId: "strike" },
      [],
      [{
        id: "ally-unit",
        name: "Ally Unit",
        allyType: "ally",
        datasheetId: "allowed-datasheet",
        keywordIds: [],
        points: 10,
        warlordMiniatureIds: [],
        allegianceAbilities: [requiredAbility.id],
      }],
      selectedAbilityMessages
    );
    assert.ok(!messageCodes(selectedAbilityMessages).includes("allied_unit.required_allegiance_ability_missing"));
  });
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
