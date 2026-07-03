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
