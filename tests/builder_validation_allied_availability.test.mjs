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
  assert.deepEqual(
    missingMessages.find((message) => message.code === "allied_unit.required_detachment_not_selected")?.scope?.unitIds,
    ["plague-marines"]
  );

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

test("all live allied faction datasheet rows have allowed and disallowed coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.alliedFactionDatasheets.length, 320);

  for (const [index, row] of realCatalog.alliedFactionDatasheets.entries()) {
    const roster = {
      factionKeywordId: firstRosterFactionForAlliedFaction(row.alliedFactionId),
      battleSizeId: battleSizeNamed("Strike Force").id,
    };
    const datasheet = realCatalog.datasheetById.get(row.datasheetId);
    assert.ok(datasheet, `Expected datasheet ${row.datasheetId}`);

    const allowedMessages = [];
    validateAlliedUnits(roster, [], [
      catalogAlliedUnit({
        id: `allied-datasheet-${index}-allowed`,
        alliedFactionId: row.alliedFactionId,
        datasheet,
        points: 0,
      }),
    ], allowedMessages);
    assert.ok(
      !messageCodes(allowedMessages).includes("allied_faction.datasheet_not_allowed"),
      `allied_faction_datasheet row ${index} should allow ${datasheet.name}`
    );

    const disallowedDatasheet = firstDatasheetOutsideAlliedFaction(row.alliedFactionId);
    const disallowedMessages = [];
    validateAlliedUnits(roster, [], [
      catalogAlliedUnit({
        id: `allied-datasheet-${index}-disallowed`,
        alliedFactionId: row.alliedFactionId,
        datasheet: disallowedDatasheet,
        points: 0,
      }),
    ], disallowedMessages);
    assert.ok(
      messageCodes(disallowedMessages).includes("allied_faction.datasheet_not_allowed"),
      `allied_faction_datasheet row ${index} should reject ${disallowedDatasheet.name}`
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
