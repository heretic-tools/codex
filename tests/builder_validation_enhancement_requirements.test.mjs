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

test("all live enhancement excluded keyword rows reject and accept target keywords", () => {
  state.catalog = realCatalog;
  const rows = realCatalog.enhancementExcludedKeywords;

  assert.equal(rows.length, 32);

  for (const row of rows) {
    const invalidCodes = validateEnhancementExcludedKeyword(row, { withKeyword: true });
    assert.ok(
      invalidCodes.includes("enhancement.model_must_not_have_excluded_keywords"),
      `Expected enhancement ${row.enhancementId} to reject excluded keyword ${row.keywordId}`
    );

    const validCodes = validateEnhancementExcludedKeyword(row, { withKeyword: false });
    assert.ok(
      !validCodes.includes("enhancement.model_must_not_have_excluded_keywords"),
      `Expected enhancement ${row.enhancementId} to accept target without excluded keyword ${row.keywordId}`
    );
  }
});

test("all live enhancement required wargear rows require and accept configured items", () => {
  state.catalog = realCatalog;
  const rows = realCatalog.enhancementRequiredWargearItems;

  assert.equal(rows.length, 1);

  for (const row of rows) {
    const missingCodes = validateEnhancementRequiredWargear(row, { equipped: false });
    assert.ok(
      missingCodes.includes("enhancement.model_does_not_have_required_wargear"),
      `Expected enhancement ${row.enhancementId} to require wargear ${row.wargearItemId}`
    );

    const equippedCodes = validateEnhancementRequiredWargear(row, { equipped: true });
    assert.ok(
      !equippedCodes.includes("enhancement.model_does_not_have_required_wargear"),
      `Expected enhancement ${row.enhancementId} to accept wargear ${row.wargearItemId}`
    );
  }
});

test("all live enhancement bodyguard groups have missing, wrong, and attached coverage", () => {
  state.catalog = realCatalog;
  const groups = realCatalog.enhancementBodyguardGroups;

  assert.equal(groups.length, 19);
  assert.equal(realCatalog.enhancementBodyguardGroupDatasheets.length, 19);
  assert.equal(realCatalog.enhancementBodyguardGroupKeywords.length, 0);

  for (const group of groups) {
    const missingCodes = validateEnhancementBodyguardGroup(group, { attached: false });
    assert.ok(
      missingCodes.includes("enhancement.attached_requirement_missing"),
      `Expected enhancement bodyguard group ${group.id} to require attachment`
    );

    const wrongDatasheetCodes = validateEnhancementBodyguardGroup(group, { attached: true, wrongDatasheet: true });
    assert.ok(
      wrongDatasheetCodes.includes("enhancement.attached_requirement_missing"),
      `Expected enhancement bodyguard group ${group.id} to reject wrong bodyguard datasheet`
    );

    const attachedCodes = validateEnhancementBodyguardGroup(group, { attached: true });
    assert.ok(
      !attachedCodes.includes("enhancement.attached_requirement_missing"),
      `Expected enhancement bodyguard group ${group.id} to accept configured bodyguard`
    );
  }
});

test("all live enhancement bodyguard groups require their configured leader or support type", () => {
  state.catalog = realCatalog;
  const groups = realCatalog.enhancementBodyguardGroups;
  let leaderRows = 0;
  let supportRows = 0;
  let validRows = 0;
  let wrongTypeRows = 0;

  assert.equal(groups.length, 19);
  assert.equal(groups.filter((group) => group.bodyguardType === "leader").length, 19);
  assert.equal(groups.filter((group) => group.bodyguardType === "support").length, 0);

  for (const group of groups) {
    if (group.bodyguardType === "leader") {
      leaderRows += 1;
    } else if (group.bodyguardType === "support") {
      supportRows += 1;
    } else {
      assert.fail(`Unexpected enhancement bodyguard type ${group.bodyguardType} for ${group.id}`);
    }

    const validCodes = validateEnhancementBodyguardGroup(group, {
      attached: true,
      attachmentType: group.bodyguardType,
    });
    assert.ok(
      !validCodes.includes("enhancement.attached_requirement_missing"),
      `Expected enhancement bodyguard group ${group.id} to accept ${group.bodyguardType}`
    );
    validRows += 1;

    const wrongType = group.bodyguardType === "leader" ? "support" : "leader";
    const wrongCodes = validateEnhancementBodyguardGroup(group, {
      attached: true,
      attachmentType: wrongType,
    });
    assert.ok(
      wrongCodes.includes("enhancement.attached_requirement_missing"),
      `Expected enhancement bodyguard group ${group.id} to reject ${wrongType}`
    );
    wrongTypeRows += 1;
  }

  assert.equal(leaderRows, 19);
  assert.equal(supportRows, 0);
  assert.equal(validRows, 19);
  assert.equal(wrongTypeRows, 19);
});

test("data-empty enhancement bodyguard faction gates stay covered", () => {
  assert.equal(realCatalog.enhancementBodyguardGroups.filter((group) => group.factionKeywordId).length, 0);

  const group = {
    ...realCatalog.enhancementBodyguardGroups[0],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
  };

  const validCodes = validateEnhancementBodyguardGroup(group, { attached: true });
  assert.ok(!validCodes.includes("enhancement.attached_requirement_missing"));

  const blockedCodes = validateEnhancementBodyguardGroup(group, { attached: true, wrongFaction: true });
  assert.ok(blockedCodes.includes("enhancement.attached_requirement_missing"));
});

test("all live enhancement required keyword groups have valid and missing requirement coverage", () => {
  state.catalog = realCatalog;
  const groups = realCatalog.enhancementRequiredKeywordGroups;
  const groupsWithKeywords = groups.filter((group) => (
    realCatalog.enhancementRequiredKeywordGroupKeywordsByGroupId.get(group.id) || []
  ).length);
  const groupsWithFactions = groups.filter((group) => (
    realCatalog.enhancementRequiredKeywordGroupFactionsByGroupId.get(group.id) || []
  ).length);
  const groupsWithDatasheets = groups.filter((group) => group.datasheetId);

  assert.equal(groups.length, 1027);
  assert.equal(groupsWithKeywords.length, 578);
  assert.equal(groupsWithFactions.length, 639);
  assert.equal(groupsWithDatasheets.length, 83);

  for (const group of groups) {
    const codes = validateEnhancementRequiredGroup(group, { label: "valid" });
    assert.ok(
      !codes.includes("enhancement.model_does_not_have_required_keywords"),
      `Expected enhancement required keyword group ${group.id} to be satisfied`
    );
  }

  for (const group of groupsWithKeywords) {
    const missingKeywordId = realCatalog.enhancementRequiredKeywordGroupKeywordsByGroupId.get(group.id)[0].keywordId;
    const codes = validateEnhancementRequiredGroup(group, { label: "missing-keyword", missingKeywordId });
    assert.ok(
      codes.includes("enhancement.model_does_not_have_required_keywords"),
      `Expected enhancement required keyword group ${group.id} to reject missing keyword ${missingKeywordId}`
    );
  }

  for (const group of groupsWithFactions) {
    const codes = validateEnhancementRequiredGroup(group, { label: "missing-faction", missingFaction: true });
    assert.ok(
      codes.includes("enhancement.model_does_not_have_required_keywords"),
      `Expected enhancement required keyword group ${group.id} to reject missing faction keyword`
    );
  }

  for (const group of groupsWithDatasheets) {
    const codes = validateEnhancementRequiredGroup(group, { label: "wrong-datasheet", wrongDatasheet: true });
    assert.ok(
      codes.includes("enhancement.model_does_not_have_required_keywords"),
      `Expected enhancement required keyword group ${group.id} to reject datasheet ${group.datasheetId} mismatch`
    );
  }
});
