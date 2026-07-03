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
  unitSummary,
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
  ENHANCEMENT_FLAG_SIZE_ID,
  countBy,
  outsideFactionId,
  outsideDatasheetId,
  catalogWithOnlyEnhancementRequiredGroup,
  enhancementRequiredGroupFixture,
  validateEnhancementRequiredGroup,
  catalogWithOnlyEnhancementExcludedKeyword,
  catalogWithOnlyEnhancementRequiredWargear,
  catalogWithOnlyEnhancementBodyguardGroup,
  enhancementFixture,
  validateEnhancementExcludedKeyword,
  optionForWargearItem,
  validateEnhancementRequiredWargear,
  bodyguardFixture,
  validateEnhancementBodyguardGroup,
  catalogWithOnlyEnhancementFlags,
  correctTargetKindForEnhancement,
  enhancementFlagUnit,
  validateEnhancementFlagRows,
} from "./builder_validation_enhancements_helpers.mjs";

test("all live enhancement rule tables stay pinned to explicit coverage counts", () => {
  state.catalog = realCatalog;

  assert.equal(realCatalog.enhancements.length, 957);
  assert.equal(realCatalog.enhancementKeywordPointsCosts.length, 0);
  assert.equal(realCatalog.enhancementExcludedKeywords.length, 32);
  assert.equal(realCatalog.enhancementRequiredWargearItems.length, 1);
  assert.equal(realCatalog.enhancementRequiredKeywordGroups.length, 1027);
  assert.equal(realCatalog.enhancementRequiredKeywordGroupKeywords.length, 670);
  assert.equal(realCatalog.enhancementRequiredKeywordGroupFactionKeywords.length, 639);
  assert.equal(realCatalog.enhancementBodyguardGroups.length, 19);
  assert.equal(realCatalog.enhancementBodyguardGroupDatasheets.length, 19);
  assert.equal(realCatalog.enhancementBodyguardGroupKeywords.length, 0);

  assert.deepEqual(countBy(realCatalog.enhancements, "enhancementType"), {
    miniature: 880,
    unit: 6,
    upgrade: 71,
  });
  assert.deepEqual(countBy(realCatalog.enhancements, "isIncludedInEnhancementLimit"), {
    false: 9,
    true: 948,
  });
  assert.deepEqual(countBy(realCatalog.enhancements, "isEquipableByEpicHero"), {
    false: 949,
    true: 8,
  });
  assert.deepEqual(countBy(realCatalog.enhancements, "isEquipableByNonCharacterUnit"), {
    false: 879,
    true: 78,
  });
  assert.deepEqual(countBy(realCatalog.enhancements, "isCombatPatrolDefault"), {
    false: 933,
    true: 24,
  });
  assert.deepEqual(countBy(realCatalog.enhancements, "cannotBeWarlord"), {
    false: 956,
    true: 1,
  });

  const requiredKeywordGroupIds = new Set(realCatalog.enhancementRequiredKeywordGroups.map((row) => row.id));
  const bodyguardGroupIds = new Set(realCatalog.enhancementBodyguardGroups.map((row) => row.id));
  const referencedKeywordGroupIds = new Set([
    ...realCatalog.enhancementRequiredKeywordGroupKeywords.map((row) => row.enhancementRequiredKeywordGroupId),
    ...realCatalog.enhancementRequiredKeywordGroupFactionKeywords.map((row) => row.enhancementRequiredKeywordGroupId),
  ]);

  assert.equal(realCatalog.enhancements.filter((row) => row.basePointsCost != null).length, 909);
  assert.equal(new Set(realCatalog.enhancements.map((row) => row.detachmentId)).size, 290);
  assert.equal(new Set(realCatalog.enhancements.filter((row) => row.isCombatPatrolDefault).map((row) => row.detachmentId)).size, 24);
  assert.equal(new Set(realCatalog.enhancementRequiredKeywordGroupKeywords.map((row) => row.enhancementRequiredKeywordGroupId)).size, 578);
  assert.equal(new Set(realCatalog.enhancementRequiredKeywordGroupFactionKeywords.map((row) => row.enhancementRequiredKeywordGroupId)).size, 639);
  assert.equal([...referencedKeywordGroupIds].filter((id) => {
    const hasKeyword = realCatalog.enhancementRequiredKeywordGroupKeywords.some((row) => row.enhancementRequiredKeywordGroupId === id);
    const hasFaction = realCatalog.enhancementRequiredKeywordGroupFactionKeywords.some((row) => row.enhancementRequiredKeywordGroupId === id);
    return hasKeyword && hasFaction;
  }).length, 190);
  assert.equal(realCatalog.enhancementRequiredKeywordGroups.filter((row) => row.datasheetId).length, 83);

  for (const row of realCatalog.enhancements) {
    assert.ok(realCatalog.detachmentById.has(row.detachmentId), `Missing detachment for enhancement ${row.id}`);
  }
  for (const row of realCatalog.enhancementExcludedKeywords) {
    assert.ok(realCatalog.enhancementById.has(row.enhancementId), `Missing enhancement for excluded keyword ${row.enhancementId}`);
    assert.ok(realCatalog.keywordById.has(row.keywordId), `Missing excluded keyword ${row.keywordId}`);
  }
  for (const row of realCatalog.enhancementRequiredWargearItems) {
    assert.ok(realCatalog.enhancementById.has(row.enhancementId), `Missing enhancement for required wargear ${row.enhancementId}`);
    assert.ok(realCatalog.wargearItemById.has(row.wargearItemId), `Missing required wargear item ${row.wargearItemId}`);
  }
  for (const row of realCatalog.enhancementRequiredKeywordGroups) {
    assert.ok(realCatalog.enhancementById.has(row.enhancementId), `Missing enhancement for required keyword group ${row.id}`);
    if (row.datasheetId) {
      assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing required keyword group datasheet ${row.datasheetId}`);
    }
  }
  for (const row of realCatalog.enhancementRequiredKeywordGroupKeywords) {
    assert.ok(requiredKeywordGroupIds.has(row.enhancementRequiredKeywordGroupId), `Missing required keyword group ${row.enhancementRequiredKeywordGroupId}`);
    assert.ok(realCatalog.keywordById.has(row.keywordId), `Missing required keyword ${row.keywordId}`);
  }
  for (const row of realCatalog.enhancementRequiredKeywordGroupFactionKeywords) {
    assert.ok(requiredKeywordGroupIds.has(row.enhancementRequiredKeywordGroupId), `Missing required keyword group ${row.enhancementRequiredKeywordGroupId}`);
    assert.ok(realCatalog.factionKeywordById.has(row.factionKeywordId), `Missing required faction keyword ${row.factionKeywordId}`);
  }
  for (const row of realCatalog.enhancementBodyguardGroups) {
    assert.ok(realCatalog.enhancementById.has(row.enhancementId), `Missing enhancement for bodyguard group ${row.id}`);
    if (row.factionKeywordId) {
      assert.ok(realCatalog.factionKeywordById.has(row.factionKeywordId), `Missing bodyguard faction keyword ${row.factionKeywordId}`);
    }
  }
  for (const row of realCatalog.enhancementBodyguardGroupDatasheets) {
    assert.ok(bodyguardGroupIds.has(row.enhancementBodyguardGroupId), `Missing bodyguard group ${row.enhancementBodyguardGroupId}`);
    assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing bodyguard datasheet ${row.datasheetId}`);
  }
});

test("all live enhancement core flag rows have target, eligibility, limit, and roster-limit coverage", () => {
  state.catalog = realCatalog;
  const enhancements = realCatalog.enhancements;
  let targetTypeInvalidRows = 0;
  let epicAllowedRows = 0;
  let epicBlockedRows = 0;
  let nonCharacterAllowedRows = 0;
  let nonCharacterBlockedRows = 0;
  let validLimitRows = 0;
  let invalidLimitRows = 0;
  let rosterIncludedRows = 0;
  let rosterExcludedRows = 0;
  let limitOneRows = 0;
  let limitThreeRows = 0;

  assert.equal(enhancements.length, 957);
  assert.equal(enhancements.filter((enhancement) => enhancement.enhancementType === "miniature").length, 880);
  assert.equal(enhancements.filter((enhancement) => enhancement.enhancementType !== "miniature").length, 77);
  assert.equal(enhancements.filter((enhancement) => enhancement.limit === 1).length, 886);
  assert.equal(enhancements.filter((enhancement) => enhancement.limit === 3).length, 71);
  assert.equal(enhancements.filter((enhancement) => enhancement.isIncludedInEnhancementLimit).length, 948);
  assert.equal(enhancements.filter((enhancement) => !enhancement.isIncludedInEnhancementLimit).length, 9);
  assert.equal(enhancements.filter((enhancement) => enhancement.isEquipableByEpicHero).length, 8);
  assert.equal(enhancements.filter((enhancement) => !enhancement.isEquipableByEpicHero).length, 949);
  assert.equal(enhancements.filter((enhancement) => enhancement.isEquipableByNonCharacterUnit).length, 78);
  assert.equal(enhancements.filter((enhancement) => !enhancement.isEquipableByNonCharacterUnit).length, 879);

  const firstIncludedEnhancement = (current) => {
    const enhancement = enhancements.find((candidate) => (
      candidate.id !== current.id && candidate.isIncludedInEnhancementLimit
    ));
    assert.ok(enhancement, `Expected included enhancement control for ${current.name}`);
    return enhancement;
  };

  for (const enhancement of enhancements) {
    const wrongTargetKind = enhancement.enhancementType === "miniature" ? "unit" : "miniature";
    const targetTypeCodes = validateEnhancementFlagRows(
      [enhancement],
      [enhancementFlagUnit(enhancement, 0, {
        targetKind: wrongTargetKind,
        keywordNames: ["Character"],
      })]
    );
    assert.ok(
      targetTypeCodes.includes("enhancement.target_type_invalid"),
      `${enhancement.name} should reject ${wrongTargetKind} target kind`
    );
    targetTypeInvalidRows += 1;

    const epicCodes = validateEnhancementFlagRows(
      [enhancement],
      [enhancementFlagUnit(enhancement, 0, { keywordNames: ["Character", "Epic Hero"] })]
    );
    if (enhancement.isEquipableByEpicHero) {
      assert.ok(
        !epicCodes.includes("enhancement.epic_hero_not_allowed"),
        `${enhancement.name} should allow Epic Hero targets`
      );
      epicAllowedRows += 1;
    } else {
      assert.ok(
        epicCodes.includes("enhancement.epic_hero_not_allowed"),
        `${enhancement.name} should reject Epic Hero targets`
      );
      epicBlockedRows += 1;
    }

    const nonCharacterCodes = validateEnhancementFlagRows(
      [enhancement],
      [enhancementFlagUnit(enhancement, 0, { keywordNames: [] })]
    );
    if (enhancement.isEquipableByNonCharacterUnit) {
      assert.ok(
        !nonCharacterCodes.includes("enhancement.unit_does_not_have_required_keywords"),
        `${enhancement.name} should allow non-Character targets`
      );
      nonCharacterAllowedRows += 1;
    } else {
      assert.ok(
        nonCharacterCodes.includes("enhancement.unit_does_not_have_required_keywords"),
        `${enhancement.name} should reject non-Character targets`
      );
      nonCharacterBlockedRows += 1;
    }

    const limit = Number(enhancement.limit || 0);
    assert.ok(limit > 0, `${enhancement.name} should have a configured selection limit`);
    if (limit === 1) {
      limitOneRows += 1;
    } else if (limit === 3) {
      limitThreeRows += 1;
    }

    const validLimitCodes = validateEnhancementFlagRows(
      [enhancement],
      Array.from({ length: limit }, (_, index) => enhancementFlagUnit(enhancement, index, { keywordNames: ["Character"] }))
    );
    assert.ok(
      !validLimitCodes.includes("enhancement.models_have_same_enhancements"),
      `${enhancement.name} should allow its configured limit of ${limit}`
    );
    validLimitRows += 1;

    const invalidLimitCodes = validateEnhancementFlagRows(
      [enhancement],
      Array.from({ length: limit + 1 }, (_, index) => enhancementFlagUnit(enhancement, index, { keywordNames: ["Character"] }))
    );
    assert.ok(
      invalidLimitCodes.includes("enhancement.models_have_same_enhancements"),
      `${enhancement.name} should reject ${limit + 1} selections`
    );
    invalidLimitRows += 1;

    const filler = firstIncludedEnhancement(enhancement);
    const rosterLimitCodes = validateEnhancementFlagRows(
      [enhancement, filler],
      [
        enhancementFlagUnit(enhancement, 0, { keywordNames: ["Character"] }),
        enhancementFlagUnit(filler, 1, { keywordNames: ["Character"] }),
      ],
      1
    );
    if (enhancement.isIncludedInEnhancementLimit) {
      assert.ok(
        rosterLimitCodes.includes("enhancement.roster_has_too_many_enhancements"),
        `${enhancement.name} should count toward the roster enhancement limit`
      );
      rosterIncludedRows += 1;
    } else {
      assert.ok(
        !rosterLimitCodes.includes("enhancement.roster_has_too_many_enhancements"),
        `${enhancement.name} should not count toward the roster enhancement limit`
      );
      rosterExcludedRows += 1;
    }
  }

  assert.equal(targetTypeInvalidRows, 957);
  assert.equal(epicAllowedRows, 8);
  assert.equal(epicBlockedRows, 949);
  assert.equal(nonCharacterAllowedRows, 78);
  assert.equal(nonCharacterBlockedRows, 879);
  assert.equal(limitOneRows, 886);
  assert.equal(limitThreeRows, 71);
  assert.equal(validLimitRows, 957);
  assert.equal(invalidLimitRows, 957);
  assert.equal(rosterIncludedRows, 948);
  assert.equal(rosterExcludedRows, 9);
});

test("all live allied faction enhancement permissions allow or reject allied enhancement selections", () => {
  state.catalog = realCatalog;
  const alliedFactions = realCatalog.alliedFactions;
  const unitEnhancement = realCatalog.enhancements.find((enhancement) => enhancement.enhancementType !== "miniature");
  let allowedRows = 0;
  let blockedRows = 0;

  assert.ok(unitEnhancement, "Expected a unit-level enhancement control");
  assert.equal(alliedFactions.length, 21);
  assert.equal(alliedFactions.filter((alliedFaction) => alliedFaction.canTakeEnhancements).length, 5);
  assert.equal(alliedFactions.filter((alliedFaction) => alliedFaction.canTakeEnhancements === false).length, 16);

  for (const [index, alliedFaction] of alliedFactions.entries()) {
    const codes = validateEnhancementFlagRows(
      [unitEnhancement],
      [enhancementFlagUnit(unitEnhancement, index, {
        allyType: alliedFaction.id,
        keywordNames: ["Character"],
      })]
    );

    if (alliedFaction.canTakeEnhancements) {
      assert.ok(
        !codes.includes("enhancement.allied_unit_not_allowed"),
        `${alliedFaction.id} should allow allied enhancement selections`
      );
      allowedRows += 1;
    } else {
      assert.ok(
        codes.includes("enhancement.allied_unit_not_allowed"),
        `${alliedFaction.id} should reject allied enhancement selections`
      );
      blockedRows += 1;
    }
  }

  assert.equal(allowedRows, 5);
  assert.equal(blockedRows, 16);
});
