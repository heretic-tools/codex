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

test("Adeptus Astartes chapter detachment point overrides are applied", () => {
  state.catalog = realCatalog;
  const blackTemplarsId = factionNamed("Black Templars").id;
  const bloodAngelsId = factionNamed("Blood Angels").id;
  const deathwatchId = factionNamed("Deathwatch").id;
  const adeptusAstartesId = factionNamed("Adeptus Astartes").id;
  const stormlance = detachmentNamed("Stormlance Task Force");
  const bastion = detachmentNamed("Bastion Task Force");

  assert.equal(costForDetachment(stormlance.id, adeptusAstartesId), 3);
  assert.equal(costForDetachment(stormlance.id, blackTemplarsId), 2);
  assert.equal(costForDetachment(stormlance.id, bloodAngelsId), 2);
  assert.equal(costForDetachment(stormlance.id, deathwatchId), 2);
  assert.equal(costForDetachment(bastion.id, adeptusAstartesId), 2);
  assert.equal(costForDetachment(bastion.id, blackTemplarsId), 3);

  const validation = validateRoster({
    id: "black-templars-dp",
    name: "Black Templars DP",
    factionKeywordId: blackTemplarsId,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [stormlance.id, bastion.id],
    units: [],
  });
  assert.equal(validation.points.detachmentPoints, 5);
  assert.ok(messageCodes(validation.messages).includes("roster.detachment_points_limit_exceeded"));
});

test("successor chapter Epic Heroes conflict with parent-faction Epic Heroes", () => {
  state.catalog = realCatalog;
  const torGaradonMessages = [];
  validateSuccessorChapterEpicHeroes([
    {
      id: "pedro",
      name: "Pedro Kantor",
      isSuccessorChapter: true,
      keywordNames: ["Epic Hero"],
      factionKeywordIds: [factionNamed("Adeptus Astartes").id, factionNamed("Imperial Fists").id],
    },
    {
      id: "tor-garadon",
      name: "Tor Garadon",
      isSuccessorChapter: false,
      keywordNames: ["Epic Hero"],
      factionKeywordIds: [factionNamed("Adeptus Astartes").id, factionNamed("Imperial Fists").id],
    },
  ], torGaradonMessages);
  assert.ok(messageCodes(torGaradonMessages).includes("roster.successor_chapter_epic_hero_in_roster"));

  const ultramarinesMessages = [];
  validateSuccessorChapterEpicHeroes([
    {
      id: "pedro",
      name: "Pedro Kantor",
      isSuccessorChapter: true,
      keywordNames: ["Epic Hero"],
      factionKeywordIds: [factionNamed("Adeptus Astartes").id, factionNamed("Imperial Fists").id],
    },
    {
      id: "calgar",
      name: "Marneus Calgar",
      isSuccessorChapter: false,
      keywordNames: ["Epic Hero"],
      factionKeywordIds: [factionNamed("Adeptus Astartes").id, factionNamed("Ultramarines").id],
    },
  ], ultramarinesMessages);
  assert.ok(!messageCodes(ultramarinesMessages).includes("roster.successor_chapter_epic_hero_in_roster"));
});

test("Devoted of Ynnead requires Yvraine or the Yncarne as Warlord", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Asuryani").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const devoted = detachmentNamed("Devoted of Ynnead");
  const farseer = miniatureNamed("Farseer");
  const yvraine = miniatureNamed("Yvraine");

  const invalidMessages = [];
  validateWarlord(roster, [devoted], [{
    id: "farseer",
    name: "Farseer",
    datasheetId: "",
    warlordMiniatureIds: [farseer.id],
    miniatures: [{ miniatureId: farseer.id, count: 1 }],
    allegianceAbilities: [],
  }], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("mandatory_warlord.detachment_not_selected"));

  const validMessages = [];
  validateWarlord(roster, [devoted], [{
    id: "yvraine",
    name: "Yvraine",
    datasheetId: "",
    warlordMiniatureIds: [yvraine.id],
    miniatures: [{ miniatureId: yvraine.id, count: 1 }],
    allegianceAbilities: [],
  }], validMessages);
  assert.ok(!messageCodes(validMessages).includes("mandatory_warlord.detachment_not_selected"));
});

test("Aeldari keyword restriction groups cover Asuryani/Ynnari exclusions and Drukhari limits", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Asuryani").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const epicHeroId = keywordNamed("Epic Hero").id;
  const yncarneKeywordId = keywordNamed("The Yncarne").id;

  const asuryaniMessages = [];
  validateKeywordRestrictions(roster, [], [{
    id: "asuryani-ynnead",
    name: "Yncarne outside Ynnari",
    keywordIds: [epicHeroId, yncarneKeywordId],
    factionKeywordIds: [factionNamed("Asuryani").id],
    warlordMiniatureIds: [],
  }], asuryaniMessages);
  assert.ok(messageCodes(asuryaniMessages).includes("keyword_restriction_group.limit_zero"));

  const ynnariMessages = [];
  validateKeywordRestrictions(roster, [], [{
    id: "ynnari-ynnead",
    name: "Yncarne as Ynnari",
    keywordIds: [epicHeroId, yncarneKeywordId],
    factionKeywordIds: [factionNamed("Ynnari").id],
    warlordMiniatureIds: [],
  }], ynnariMessages);
  assert.ok(!messageCodes(ynnariMessages).includes("keyword_restriction_group.limit_zero"));

  const deathJesterDatasheet = datasheetNamed("Death Jester");
  const drukhariRoster = {
    factionKeywordId: factionNamed("Drukhari").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const drukhariValidMessages = [];
  validateKeywordRestrictions(
    drukhariRoster,
    [],
    [rosterUnitFromDatasheetId(deathJesterDatasheet.id, "death-jester-1")],
    drukhariValidMessages
  );
  assert.ok(!messageCodes(drukhariValidMessages).includes("keyword_restriction_group.limit_exceeded"));

  const drukhariLimitMessages = [];
  validateKeywordRestrictions(
    drukhariRoster,
    [],
    [
      rosterUnitFromDatasheetId(deathJesterDatasheet.id, "death-jester-1"),
      rosterUnitFromDatasheetId(deathJesterDatasheet.id, "death-jester-2"),
    ],
    drukhariLimitMessages
  );
  assert.ok(messageCodes(drukhariLimitMessages).includes("keyword_restriction_group.limit_exceeded"));
});

test("all live top-level keyword restriction limits have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  const limitedGroups = realCatalog.keywordRestrictionGroups
    .filter((group) => group.limit != null);
  assert.equal(limitedGroups.length, 15);

  for (const group of limitedGroups) {
    const keywordIds = (realCatalog.keywordRestrictionGroupKeywordsByGroupId.get(group.id) || [])
      .map((row) => row.keywordId);
    assert.ok(keywordIds.length, `${group.id} should have restricted keywords`);

    const validMessages = [];
    const validUnits = group.limit === 0
      ? [{
        id: `${group.id}:excluded-valid`,
        name: "Excluded Valid",
        keywordIds,
        factionKeywordIds: [group.excludedFactionKeywordId],
        warlordMiniatureIds: [],
      }]
      : Array.from({ length: group.limit }, (_, index) => ({
        id: `${group.id}:valid-${index}`,
        name: "Restricted Valid",
        keywordIds,
        factionKeywordIds: [group.factionKeywordId],
        warlordMiniatureIds: [],
      }));
    validateKeywordRestrictions(
      {
        factionKeywordId: group.factionKeywordId,
        battleSizeId: battleSizeNamed("Strike Force").id,
      },
      [],
      validUnits,
      validMessages
    );
    assert.ok(
      !messageCodes(validMessages).some((code) => code.startsWith("keyword_restriction_group.")),
      `${group.id} should allow its configured limit`
    );

    const invalidCount = group.limit === 0 ? 1 : group.limit + 1;
    const invalidUnits = Array.from({ length: invalidCount }, (_, index) => ({
      id: `${group.id}:invalid-${index}`,
      name: "Restricted Invalid",
      keywordIds,
      factionKeywordIds: [group.factionKeywordId],
      warlordMiniatureIds: [],
    }));
    const invalidMessages = [];
    validateKeywordRestrictions(
      {
        factionKeywordId: group.factionKeywordId,
        battleSizeId: battleSizeNamed("Strike Force").id,
      },
      [],
      invalidUnits,
      invalidMessages
    );
    const expectedCode = group.limit === 0
      ? "keyword_restriction_group.limit_zero"
      : "keyword_restriction_group.limit_exceeded";
    assert.ok(messageCodes(invalidMessages).includes(expectedCode), `${group.id} should emit ${expectedCode}`);
  }
});

test("detachment keyword restrictions enforce minimum and maximum roster limits", () => {
  state.catalog = realCatalog;

  const warDogDatasheet = datasheetNamed("War Dog Brigand");
  const minimumMessages = [];
  validateKeywordRestrictions(
    {
      factionKeywordId: factionNamed("Space Wolves").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Houndpack Lance")],
    [
      rosterUnitFromDatasheetId(warDogDatasheet.id, "war-dog-1"),
      rosterUnitFromDatasheetId(warDogDatasheet.id, "war-dog-2"),
    ],
    minimumMessages
  );
  assert.ok(messageCodes(minimumMessages).includes("keyword_restriction_group.minimum_not_met"));

  const troupeMasterDatasheet = datasheetNamed("Troupe Master");
  const maximumMessages = [];
  validateKeywordRestrictions(
    {
      factionKeywordId: factionNamed("Harlequins").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Ghosts of the Webway")],
    [0, 1, 2, 3].map((index) => rosterUnitFromDatasheetId(troupeMasterDatasheet.id, `troupe-master-${index}`)),
    maximumMessages
  );
  assert.ok(messageCodes(maximumMessages).includes("keyword_restriction_group.limit_exceeded"));
});

test("all live detachment keyword restriction limits have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  const limits = realCatalog.restrictionGroupDetachmentLimits;
  assert.equal(limits.length, 7);
  const neutralRosterFactionId = factionNamed("Harlequins").id;

  for (const limit of limits) {
    const detachment = realCatalog.detachmentById.get(limit.detachmentId);
    const group = realCatalog.keywordRestrictionGroups.find((item) => item.id === limit.restrictionGroupId);
    assert.ok(detachment, `${limit.detachmentId} should resolve to a detachment`);
    assert.ok(group, `${limit.restrictionGroupId} should resolve to a keyword restriction group`);

    const keywordIds = (realCatalog.keywordRestrictionGroupKeywordsByGroupId.get(group.id) || [])
      .map((row) => row.keywordId);
    assert.ok(keywordIds.length, `${group.id} should have restricted keywords`);
    const unit = (id) => ({
      id,
      name: "Restricted Detachment Unit",
      keywordIds,
      factionKeywordIds: [group.factionKeywordId],
      warlordMiniatureIds: [],
    });
    const validateCount = (count) => {
      const messages = [];
      validateKeywordRestrictions(
        {
          factionKeywordId: neutralRosterFactionId,
          battleSizeId: battleSizeNamed("Strike Force").id,
        },
        [detachment],
        Array.from({ length: count }, (_, index) => unit(`${limit.id}:${index}`)),
        messages
      );
      return messageCodes(messages);
    };

    if (limit.minRosterLimit != null) {
      assert.ok(
        !validateCount(limit.minRosterLimit).some((code) => code.startsWith("keyword_restriction_group.")),
        `${detachment.name}:${group.id} should allow the configured detachment minimum`
      );
      assert.ok(
        validateCount(limit.minRosterLimit - 1).includes("keyword_restriction_group.minimum_not_met"),
        `${detachment.name}:${group.id} should emit keyword_restriction_group.minimum_not_met`
      );
    }
    if (limit.maxRosterLimit != null) {
      assert.ok(
        !validateCount(limit.maxRosterLimit).some((code) => code.startsWith("keyword_restriction_group.")),
        `${detachment.name}:${group.id} should allow the configured detachment maximum`
      );
      assert.ok(
        validateCount(limit.maxRosterLimit + 1).includes("keyword_restriction_group.limit_exceeded"),
        `${detachment.name}:${group.id} should emit keyword_restriction_group.limit_exceeded`
      );
    }
  }
});
