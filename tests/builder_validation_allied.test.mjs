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

test("Heretic Astartes Legiones Daemonica allies enforce points and restricting keyword caps", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const allyType = alliedFactionWithParent("Legiones Daemonica");

  const pointsMessages = [];
  validateAlliedUnits(roster, [], [
    alliedUnit({ id: "bloodletters", datasheetName: "Bloodletters", allyType, points: 501 }),
  ], pointsMessages);
  assert.ok(messageCodes(pointsMessages).includes("allied_points.limit_exceeded"));

  const restrictingMessages = [];
  validateAlliedUnits(roster, [], [
    alliedUnit({ id: "bloodmaster", datasheetName: "Bloodmaster", allyType, points: 100 }),
  ], restrictingMessages);
  assert.ok(messageCodes(restrictingMessages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"));
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
