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

test("Pactbound Zealots Mark of Chaos enforces mandatory single selection and detachment scope", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const group = allegianceGroup("Mark of Chaos", "Pactbound Zealots", ["Khorne", "Nurgle"]);
  const khorne = allegianceAbility(group.id, "Khorne");
  const nurgle = allegianceAbility(group.id, "Nurgle");

  const missingMessages = [];
  validateAllegianceAbilities(
    roster,
    [detachmentNamed("Pactbound Zealots")],
    [allegianceUnit({ id: "missing-mark", group })],
    missingMessages
  );
  assert.ok(messageCodes(missingMessages).includes("allegiance_ability.not_selected"));

  const multipleMessages = [];
  validateAllegianceAbilities(
    roster,
    [detachmentNamed("Pactbound Zealots")],
    [allegianceUnit({ id: "too-many-marks", group, abilities: [khorne, nurgle] })],
    multipleMessages
  );
  assert.ok(messageCodes(multipleMessages).includes("allegiance_ability.multiple_selected"));

  const detachmentMessages = [];
  validateAllegianceAbilities(
    roster,
    [],
    [allegianceUnit({ id: "wrong-detachment", group, abilities: [khorne] })],
    detachmentMessages
  );
  assert.ok(messageCodes(detachmentMessages).includes("allegiance_ability.required_detachment_missing"));
});

test("Daemonic Allegiance abilities enforce required wargear", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Legiones Daemonica").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const { group, ability } = allegianceAbilityWithRequiredWargear("Daemonic Allegiance", "Khorne");

  const messages = [];
  validateAllegianceAbilities(
    roster,
    [],
    [allegianceUnit({ id: "missing-required-wargear", group, abilities: [ability] })],
    messages
  );
  assert.ok(messageCodes(messages).includes("allegiance_ability.missing_wargear_item"));
});

test("allegiance abilities reject wrong groups and mandatory faction choices", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const markGroup = allegianceGroup("Mark of Chaos", "Pactbound Zealots", ["Khorne"]);
  const daemonicGroup = allegianceGroup("Daemonic Allegiance", "", ["Khorne"]);
  const daemonicKhorne = allegianceAbility(daemonicGroup.id, "Khorne");

  const wrongGroupMessages = [];
  validateAllegianceAbilities(
    roster,
    [detachmentNamed("Pactbound Zealots")],
    [allegianceUnit({ id: "wrong-group", group: markGroup, abilities: [daemonicKhorne] })],
    wrongGroupMessages
  );
  assert.ok(messageCodes(wrongGroupMessages).includes("allegiance_ability.not_allowed"));

  const group = { id: "mandatory-group", name: "Mandatory Group" };
  const mandatory = {
    id: "mandatory-ability",
    name: "Mandatory Ability",
    allegianceAbilityGroupId: group.id,
    groupId: group.id,
  };
  const alternate = {
    id: "alternate-ability",
    name: "Alternate Ability",
    allegianceAbilityGroupId: group.id,
    groupId: group.id,
  };
  const catalog = {
    allegianceAbilityGroupById: new Map([[group.id, group]]),
    allegianceAbilityGroups: [group],
    mandatoryAllegianceAbilitiesByFactionId: new Map([[
      "parent-faction",
      [{ allegianceAbilityId: mandatory.id }],
    ]]),
    allegianceAbilityById: new Map([
      [mandatory.id, mandatory],
      [alternate.id, alternate],
    ]),
    wargearItemById: new Map(),
    factionKeywordById: new Map([
      ["child-faction", { id: "child-faction", parentFactionKeywordId: "parent-faction" }],
      ["parent-faction", { id: "parent-faction", parentFactionKeywordId: "" }],
    ]),
    factionById: new Map([["child-faction", { id: "child-faction", name: "Synthetic Child Faction" }]]),
    battleSizeById: new Map(),
  };
  withCatalog(catalog, () => {
    const mandatoryMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: "child-faction" },
      [],
      [allegianceUnit({ id: "mandatory-miss", group, abilities: [alternate] })],
      mandatoryMessages
    );
    assert.ok(messageCodes(mandatoryMessages).includes("allegiance_ability.mandatory_not_selected"));

    const selectedMandatoryMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: "child-faction" },
      [],
      [allegianceUnit({ id: "mandatory-selected", group, abilities: [mandatory.id] })],
      selectedMandatoryMessages
    );
    assert.ok(!messageCodes(selectedMandatoryMessages).includes("allegiance_ability.mandatory_not_selected"));
  });
});

test("detachment allegiance keyword groups enforce roster min and max limits", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Space Wolves").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };

  const houndpackGroup = allegianceGroup("Houndpack Lance Keyword", "Houndpack Lance", ["Character"]);
  const houndpackCharacter = allegianceAbility(houndpackGroup.id, "Character");
  const minMessages = [];
  validateAllegianceAbilities(
    roster,
    [detachmentNamed("Houndpack Lance")],
    [
      allegianceUnit({ id: "houndpack-1", group: houndpackGroup, abilities: [houndpackCharacter] }),
      allegianceUnit({ id: "houndpack-2", group: houndpackGroup, abilities: [houndpackCharacter] }),
    ],
    minMessages
  );
  assert.ok(messageCodes(minMessages).includes("allegiance_ability.group_limit_not_reached"));

  const headhunterGroup = allegianceGroup("Headhunter Task Force Keywords", "Headhunter Task Force", ["Character"]);
  const headhunterCharacter = allegianceAbility(headhunterGroup.id, "Character");
  const maxMessages = [];
  validateAllegianceAbilities(
    roster,
    [detachmentNamed("Headhunter Task Force")],
    [
      allegianceUnit({ id: "headhunter-1", group: headhunterGroup, abilities: [headhunterCharacter] }),
      allegianceUnit({ id: "headhunter-2", group: headhunterGroup, abilities: [headhunterCharacter] }),
      allegianceUnit({ id: "headhunter-3", group: headhunterGroup, abilities: [headhunterCharacter] }),
      allegianceUnit({ id: "headhunter-4", group: headhunterGroup, abilities: [headhunterCharacter] }),
    ],
    maxMessages
  );
  assert.ok(messageCodes(maxMessages).includes("allegiance_ability.group_limit_exceeded"));
});
