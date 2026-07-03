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

test("data-empty allied edge rows cover global restrictions, duplicate restrictions, and malformed slotless groups", () => {
  assert.equal(realCatalog.keywordAllyRestrictingKeywords.length, 0);
  assert.equal(realCatalog.alliedFactionKeywordSlotlessKeywordGroups.filter((group) => {
    const donorRows = realCatalog.alliedFactionKeywordSlotlessDonorsByGroupId.get(group.id) || [];
    const receiverRows = realCatalog.alliedFactionKeywordSlotlessReceiversByGroupId.get(group.id) || [];
    return !donorRows.length || !receiverRows.length;
  }).length, 0);

  const catalog = {
    factionAlliedFactionsByFactionId: new Map([["roster-faction", [{ alliedFactionId: "ally" }]]]),
    alliedFactionParentsByAlliedFactionId: new Map([["ally", [{ factionKeywordId: "ally-parent" }]]]),
    alliedFactionById: new Map([["ally", {}]]),
    alliedFactionDatasheetsByAlliedFactionId: new Map([["ally", [{ datasheetId: "allowed-datasheet" }]]]),
    alliedFactionPointsLimitsByAlliedFactionId: new Map(),
    alliedFactionKeywordsByAlliedFactionId: new Map([["ally", [{
      id: "slotless-limit",
      alliedFactionId: "ally",
      keywordId: "receiver-keyword",
      limitCount: 0,
      requiredWarlordMiniatureId: "",
      battleSizeId: "strike",
    }]]]),
    alliedFactionAllowedWarlordsByAlliedFactionId: new Map(),
    alliedFactionRequiredDetachmentsByAlliedFactionId: new Map(),
    alliedFactionAllegianceAbilitiesByAlliedFactionId: new Map(),
    alliedFactionKeywordSlotlessGroupsByKeywordId: new Map([["slotless-limit", [
      { id: "slotless-no-donor", alliedFactionKeywordId: "slotless-limit" },
      { id: "slotless-no-receiver", alliedFactionKeywordId: "slotless-limit" },
    ]]]),
    alliedFactionKeywordSlotlessDonorsByGroupId: new Map([
      ["slotless-no-receiver", [{ keywordId: "donor-keyword" }]],
    ]),
    alliedFactionKeywordSlotlessReceiversByGroupId: new Map([
      ["slotless-no-donor", [{ keywordId: "receiver-keyword" }]],
    ]),
    keywordAllyRestrictingKeywords: [
      { keywordId: "restricted-keyword", restrictingKeywordId: "restricting-keyword" },
      { keywordId: "restricted-keyword", restrictingKeywordId: "restricting-keyword" },
    ],
    keywords: [
      {
        id: "restricted-keyword",
        name: "Restricted Keyword",
        allyRestrictingKeywordId: "restricting-keyword",
        allyRestrictingFactionKeywordId: "",
      },
      { id: "restricting-keyword", name: "Restricting Keyword" },
    ],
    keywordById: new Map([
      ["receiver-keyword", { id: "receiver-keyword", name: "Receiver Keyword" }],
      ["donor-keyword", { id: "donor-keyword", name: "Donor Keyword" }],
      ["restricted-keyword", {
        id: "restricted-keyword",
        name: "Restricted Keyword",
        allyRestrictingFactionKeywordId: "",
      }],
      ["restricting-keyword", { id: "restricting-keyword", name: "Restricting Keyword" }],
    ]),
    factionById: new Map([["roster-faction", { id: "roster-faction", name: "Roster Faction" }]]),
    factionKeywordById: new Map([
      ["roster-faction", { id: "roster-faction", name: "Roster Faction", parentFactionKeywordId: "" }],
      ["ally-parent", { id: "ally-parent", name: "Ally Parent", parentFactionKeywordId: "" }],
    ]),
    battleSizeById: new Map([["strike", { id: "strike", name: "Strike Force" }]]),
    detachmentById: new Map(),
    miniatureById: new Map(),
    allegianceAbilityById: new Map(),
    allegianceAbilityGroupById: new Map(),
  };
  const messages = [];
  withCatalog(catalog, () => {
    validateAlliedUnits(
      { factionKeywordId: "roster-faction", battleSizeId: "strike" },
      [],
      [{
        id: "ally-unit",
        name: "Ally Unit",
        allyType: "ally",
        datasheetId: "allowed-datasheet",
        keywordIds: ["receiver-keyword", "restricted-keyword"],
        points: 0,
        warlordMiniatureIds: [],
      }],
      messages
    );
  });

  const codes = messageCodes(messages);
  assert.ok(codes.includes("allied_keyword_count.limit_exceeded"));
  assert.equal(
    codes.filter((code) => code === "allied_keyword_restricting_keyword.outnumbered_keywords").length,
    1
  );
});

test("data-empty allied faction top-level required detachment and warlord fields stay covered", () => {
  assert.equal(realCatalog.alliedFactions.filter((alliedFaction) => alliedFaction.requiredDetachmentId).length, 0);
  assert.equal(realCatalog.alliedFactions.filter((alliedFaction) => alliedFaction.requiredWarlordMiniatureId).length, 0);

  const catalog = {
    factionAlliedFactionsByFactionId: new Map([["roster-faction", [{ alliedFactionId: "ally" }]]]),
    alliedFactionParentsByAlliedFactionId: new Map([["ally", [{ factionKeywordId: "ally-parent" }]]]),
    alliedFactionById: new Map([[
      "ally",
      {
        id: "ally",
        requiredDetachmentId: "required-detachment",
        requiredWarlordMiniatureId: "required-warlord",
      },
    ]]),
    alliedFactionDatasheetsByAlliedFactionId: new Map([["ally", [{ datasheetId: "allowed-datasheet" }]]]),
    alliedFactionPointsLimitsByAlliedFactionId: new Map(),
    alliedFactionKeywordsByAlliedFactionId: new Map(),
    alliedFactionAllowedWarlordsByAlliedFactionId: new Map(),
    alliedFactionRequiredDetachmentsByAlliedFactionId: new Map(),
    alliedFactionAllegianceAbilitiesByAlliedFactionId: new Map(),
    alliedFactionKeywordSlotlessGroupsByKeywordId: new Map(),
    alliedFactionKeywordSlotlessDonorsByGroupId: new Map(),
    alliedFactionKeywordSlotlessReceiversByGroupId: new Map(),
    keywordAllyRestrictingKeywords: [],
    keywords: [],
    keywordById: new Map(),
    miniatureById: new Map([["required-warlord", { id: "required-warlord", name: "Required Warlord" }]]),
    detachmentById: new Map([["required-detachment", { id: "required-detachment", name: "Required Detachment" }]]),
    factionById: new Map([["roster-faction", { id: "roster-faction", name: "Roster Faction" }]]),
    factionKeywordById: new Map([["ally-parent", { id: "ally-parent", name: "Ally Parent" }]]),
    battleSizeById: new Map(),
    allegianceAbilityById: new Map(),
    allegianceAbilityGroupById: new Map(),
  };
  const roster = { factionKeywordId: "roster-faction", battleSizeId: "strike" };
  const unit = {
    id: "ally-unit",
    name: "Ally Unit",
    allyType: "ally",
    datasheetId: "allowed-datasheet",
    keywordIds: [],
    points: 0,
    warlordMiniatureIds: [],
  };

  withCatalog(catalog, () => {
    const missingMessages = [];
    validateAlliedUnits(roster, [], [unit], missingMessages);
    assert.ok(messageCodes(missingMessages).includes("allied_unit.required_detachment_not_selected"));
    assert.ok(messageCodes(missingMessages).includes("allied_units.required_warlord_missing"));

    const selectedMessages = [];
    validateAlliedUnits(
      roster,
      [{ id: "required-detachment", name: "Required Detachment" }],
      [{ ...unit, warlordMiniatureIds: ["required-warlord"] }],
      selectedMessages
    );
    assert.ok(!messageCodes(selectedMessages).includes("allied_unit.required_detachment_not_selected"));
    assert.ok(!messageCodes(selectedMessages).includes("allied_units.required_warlord_missing"));
  });
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
