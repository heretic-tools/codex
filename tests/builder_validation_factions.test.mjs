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
  const messages = [];
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
  ], messages);
  assert.ok(messageCodes(messages).includes("roster.successor_chapter_epic_hero_in_roster"));
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

test("Asuryani keyword restriction groups exclude Ynnari units where configured", () => {
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
