import assert from "node:assert/strict";
import test from "node:test";
import {
  state,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  factionScope,
  unitSummary,
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

function firstAbilityForGroup(groupId) {
  const ability = (realCatalog.allegianceAbilitiesByGroupId.get(groupId) || [])[0];
  assert.ok(ability, `Expected allegiance ability for group ${groupId}`);
  return {
    ...ability,
    groupId: ability.allegianceAbilityGroupId,
    groupName: realCatalog.allegianceAbilityGroupById.get(ability.allegianceAbilityGroupId)?.name,
  };
}

function optionIdForWargearItem(wargearItemId) {
  const option = realCatalog.wargearOptions.find((row) => row.wargearItemId === wargearItemId);
  assert.ok(option, `Expected wargear option for item ${wargearItemId}`);
  return option.id;
}

function detachmentForGroup(group) {
  return group.detachmentId ? [realCatalog.detachmentById.get(group.detachmentId)] : [];
}

function rosterFactionIdForDatasheet(datasheetId) {
  const row = realCatalog.datasheetFactionKeywordsByDatasheetId.get(datasheetId)?.[0];
  assert.ok(row, `Expected datasheet ${datasheetId} to have a faction keyword`);
  return row.factionKeywordId;
}

function selectedAbility(ability) {
  const group = realCatalog.allegianceAbilityGroupById.get(ability.allegianceAbilityGroupId);
  return {
    ...ability,
    groupId: ability.allegianceAbilityGroupId,
    groupName: group?.name,
  };
}

function summarizedAllegianceUnit(datasheet, ability = null) {
  const rawUnit = {
    id: `${datasheet.id}:${ability?.id || "no-ability"}`,
    datasheetId: datasheet.id,
    allegianceAbilities: ability ? [selectedAbility(ability)] : [],
    wargear: {},
  };
  if (ability?.requiresWargearItemId) {
    rawUnit.wargear[optionIdForWargearItem(ability.requiresWargearItemId)] = 1;
  }
  const roster = {
    factionKeywordId: rosterFactionIdForDatasheet(datasheet.id),
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [rawUnit],
  };
  return {
    roster,
    unit: unitSummary(roster, rawUnit),
  };
}

test("all live allegiance rule tables stay pinned to explicit coverage counts", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.allegianceAbilityGroups.length, 10);
  assert.equal(realCatalog.allegianceAbilities.length, 26);
  assert.equal(realCatalog.factionKeywordMandatoryAllegianceAbilities.length, 0);
  assert.equal(realCatalog.alliedFactionAllegianceAbilities.length, 0);
  assert.equal(realCatalog.allegianceAbilityGroups.filter((group) => group.isMandatory).length, 5);
  assert.equal(realCatalog.allegianceAbilityGroups.filter((group) => group.detachmentId).length, 7);
  assert.equal(realCatalog.allegianceAbilityGroups.filter((group) => group.minRosterLimit != null).length, 1);
  assert.equal(realCatalog.allegianceAbilityGroups.filter((group) => group.maxRosterLimit != null).length, 4);
  assert.equal(realCatalog.allegianceAbilities.filter((ability) => ability.requiresWargearItemId).length, 4);
});

test("all live allegiance ability rows are accepted by their configured group", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.allegianceAbilities.length, 26);

  for (const [index, ability] of realCatalog.allegianceAbilities.entries()) {
    const group = realCatalog.allegianceAbilityGroupById.get(ability.allegianceAbilityGroupId);
    assert.ok(group, `Expected group ${ability.allegianceAbilityGroupId}`);
    const unit = allegianceUnit({
      id: `allegiance-ability-${index}`,
      group,
      abilities: [{
        ...ability,
        groupId: ability.allegianceAbilityGroupId,
        groupName: group.name,
      }],
    });
    if (ability.requiresWargearItemId) {
      unit.wargear[optionIdForWargearItem(ability.requiresWargearItemId)] = 1;
    }

    const messages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Heretic Astartes").id },
      detachmentForGroup(group),
      [unit],
      messages
    );
    const codes = messageCodes(messages);
    assert.ok(!codes.includes("allegiance_ability.not_allowed"), `${ability.name} should be allowed in ${group.name}`);
    assert.ok(!codes.includes("allegiance_ability.required_detachment_missing"), `${ability.name} should have its detachment selected`);
    assert.ok(!codes.includes("allegiance_ability.missing_wargear_item"), `${ability.name} should have required wargear selected when needed`);
    assert.ok(!codes.includes("allegiance_ability.not_selected"), `${ability.name} should satisfy mandatory group selection`);
    assert.ok(!codes.includes("allegiance_ability.multiple_selected"), `${ability.name} should be a single group selection`);
  }
});

test("data-empty missing allegiance ability groups stay cache-compatible", () => {
  state.catalog = realCatalog;
  const messages = [];
  validateAllegianceAbilities(
    { factionKeywordId: factionNamed("Space Wolves").id },
    [],
    [{
      id: "cached-missing-allegiance-group-unit",
      name: "Cached Missing Allegiance Group Unit",
      allegianceAbilityGroupId: "missing-allegiance-group",
      allegianceAbilities: [{
        id: "cached-missing-allegiance-ability",
        name: "Cached Missing Allegiance Ability",
        groupId: "missing-allegiance-group",
        groupName: "Missing Allegiance Group",
      }],
    }],
    messages
  );
  assert.deepEqual(messages, []);
});

test("all live datasheet allegiance group rows drive allowed, mandatory, and detachment checks", () => {
  state.catalog = realCatalog;
  const datasheets = realCatalog.datasheets.filter((datasheet) => datasheet.allegianceAbilityGroupId);
  let validRows = 0;
  let wrongGroupRows = 0;
  let mandatoryRows = 0;
  let detachmentRows = 0;
  let requiredWargearRows = 0;

  assert.equal(datasheets.length, 92);
  assert.equal(new Set(datasheets.map((datasheet) => datasheet.allegianceAbilityGroupId)).size, 10);
  assert.equal(datasheets.filter((datasheet) => realCatalog.allegianceAbilityGroupById.get(datasheet.allegianceAbilityGroupId)?.isMandatory).length, 48);
  assert.equal(datasheets.filter((datasheet) => realCatalog.allegianceAbilityGroupById.get(datasheet.allegianceAbilityGroupId)?.detachmentId).length, 87);
  assert.equal(datasheets.filter((datasheet) => (
    realCatalog.allegianceAbilitiesByGroupId.get(datasheet.allegianceAbilityGroupId) || []
  ).some((ability) => ability.requiresWargearItemId)).length, 1);

  for (const datasheet of datasheets) {
    const group = realCatalog.allegianceAbilityGroupById.get(datasheet.allegianceAbilityGroupId);
    assert.ok(group, `Expected allegiance group ${datasheet.allegianceAbilityGroupId}`);
    const ability = firstAbilityForGroup(group.id);
    const { roster, unit } = summarizedAllegianceUnit(datasheet, ability);
    assert.equal(unit.allegianceAbilityGroupId, group.id, `${datasheet.name} should summarize with its datasheet allegiance group`);

    const validMessages = [];
    validateAllegianceAbilities(roster, detachmentForGroup(group), [unit], validMessages);
    assert.ok(!messageCodes(validMessages).includes("allegiance_ability.not_allowed"), `${datasheet.name} should allow ${ability.name}`);
    assert.ok(!messageCodes(validMessages).includes("allegiance_ability.not_selected"), `${datasheet.name} should satisfy mandatory selection`);
    assert.ok(!messageCodes(validMessages).includes("allegiance_ability.required_detachment_missing"), `${datasheet.name} should have its detachment selected`);
    assert.ok(!messageCodes(validMessages).includes("allegiance_ability.missing_wargear_item"), `${datasheet.name} should carry required wargear when needed`);
    validRows += 1;
    if (ability.requiresWargearItemId) {
      requiredWargearRows += 1;
    }

    const wrongAbility = realCatalog.allegianceAbilities.find((item) => item.allegianceAbilityGroupId !== group.id);
    assert.ok(wrongAbility, `Expected wrong allegiance ability control for ${datasheet.name}`);
    const wrong = summarizedAllegianceUnit(datasheet, wrongAbility);
    const wrongMessages = [];
    validateAllegianceAbilities(wrong.roster, detachmentForGroup(group), [wrong.unit], wrongMessages);
    assert.ok(
      messageCodes(wrongMessages).includes("allegiance_ability.not_allowed"),
      `${datasheet.name} should reject allegiance abilities from another group`
    );
    wrongGroupRows += 1;

    if (group.isMandatory) {
      const missing = summarizedAllegianceUnit(datasheet);
      const missingMessages = [];
      validateAllegianceAbilities(missing.roster, detachmentForGroup(group), [missing.unit], missingMessages);
      assert.ok(
        messageCodes(missingMessages).includes("allegiance_ability.not_selected"),
        `${datasheet.name} should require one ${group.name} selection`
      );
      mandatoryRows += 1;
    }

    if (group.detachmentId) {
      const detachmentMessages = [];
      validateAllegianceAbilities(roster, [], [unit], detachmentMessages);
      assert.ok(
        messageCodes(detachmentMessages).includes("allegiance_ability.required_detachment_missing"),
        `${datasheet.name} should require ${realCatalog.detachmentById.get(group.detachmentId)?.name}`
      );
      detachmentRows += 1;
    }
  }

  assert.equal(validRows, 92);
  assert.equal(wrongGroupRows, 92);
  assert.equal(mandatoryRows, 48);
  assert.equal(detachmentRows, 87);
  assert.equal(requiredWargearRows, 1);
});

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

test("all live mandatory allegiance groups require one selection and reject multiples", () => {
  state.catalog = realCatalog;
  const mandatoryGroups = realCatalog.allegianceAbilityGroups.filter((group) => group.isMandatory);
  assert.equal(mandatoryGroups.length, 5);

  for (const [index, group] of mandatoryGroups.entries()) {
    const abilities = realCatalog.allegianceAbilitiesByGroupId.get(group.id) || [];
    assert.ok(abilities.length >= 2, `Expected at least two abilities for mandatory group ${group.name}`);

    const missingMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Heretic Astartes").id },
      detachmentForGroup(group),
      [allegianceUnit({ id: `mandatory-${index}-missing`, group })],
      missingMessages
    );
    assert.ok(
      messageCodes(missingMessages).includes("allegiance_ability.not_selected"),
      `${group.name} should require a selection`
    );

    const singleMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Heretic Astartes").id },
      detachmentForGroup(group),
      [allegianceUnit({ id: `mandatory-${index}-single`, group, abilities: [firstAbilityForGroup(group.id)] })],
      singleMessages
    );
    assert.ok(
      !messageCodes(singleMessages).includes("allegiance_ability.not_selected"),
      `${group.name} should be satisfied by one selection`
    );

    const multipleMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Heretic Astartes").id },
      detachmentForGroup(group),
      [allegianceUnit({
        id: `mandatory-${index}-multiple`,
        group,
        abilities: abilities.slice(0, 2).map((ability) => ({
          ...ability,
          groupId: ability.allegianceAbilityGroupId,
          groupName: group.name,
        })),
      })],
      multipleMessages
    );
    assert.ok(
      messageCodes(multipleMessages).includes("allegiance_ability.multiple_selected"),
      `${group.name} should reject multiple selections`
    );
  }
});

test("all live detachment-scoped allegiance groups require their detachment", () => {
  state.catalog = realCatalog;
  const detachmentGroups = realCatalog.allegianceAbilityGroups.filter((group) => group.detachmentId);
  assert.equal(detachmentGroups.length, 7);

  for (const [index, group] of detachmentGroups.entries()) {
    const selected = allegianceUnit({
      id: `detachment-group-${index}`,
      group,
      abilities: [firstAbilityForGroup(group.id)],
    });

    const missingMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Heretic Astartes").id },
      [],
      [selected],
      missingMessages
    );
    assert.ok(
      messageCodes(missingMessages).includes("allegiance_ability.required_detachment_missing"),
      `${group.name} should require ${realCatalog.detachmentById.get(group.detachmentId)?.name}`
    );

    const selectedMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Heretic Astartes").id },
      detachmentForGroup(group),
      [selected],
      selectedMessages
    );
    assert.ok(
      !messageCodes(selectedMessages).includes("allegiance_ability.required_detachment_missing"),
      `${group.name} should pass when its detachment is selected`
    );
  }
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

test("all live allegiance abilities with required wargear require and accept that wargear", () => {
  state.catalog = realCatalog;
  const abilities = realCatalog.allegianceAbilities.filter((ability) => ability.requiresWargearItemId);
  assert.equal(abilities.length, 4);

  for (const [index, ability] of abilities.entries()) {
    const group = realCatalog.allegianceAbilityGroupById.get(ability.allegianceAbilityGroupId);
    const selected = {
      ...ability,
      groupId: ability.allegianceAbilityGroupId,
      groupName: group.name,
    };

    const missingMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Legiones Daemonica").id },
      [],
      [allegianceUnit({ id: `required-wargear-${index}-missing`, group, abilities: [selected] })],
      missingMessages
    );
    assert.ok(
      messageCodes(missingMessages).includes("allegiance_ability.missing_wargear_item"),
      `${ability.name} should require ${realCatalog.wargearItemById.get(ability.requiresWargearItemId)?.name}`
    );

    const equippedUnit = allegianceUnit({ id: `required-wargear-${index}-selected`, group, abilities: [selected] });
    equippedUnit.wargear[optionIdForWargearItem(ability.requiresWargearItemId)] = 1;
    const equippedMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Legiones Daemonica").id },
      [],
      [equippedUnit],
      equippedMessages
    );
    assert.ok(
      !messageCodes(equippedMessages).includes("allegiance_ability.missing_wargear_item"),
      `${ability.name} should pass once the required wargear is selected`
    );
  }
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

test("all live allegiance roster min and max groups have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  const minGroups = realCatalog.allegianceAbilityGroups.filter((group) => group.minRosterLimit != null);
  const maxGroups = realCatalog.allegianceAbilityGroups.filter((group) => group.maxRosterLimit != null);
  assert.equal(minGroups.length, 1);
  assert.equal(maxGroups.length, 4);

  for (const [index, group] of minGroups.entries()) {
    const ability = firstAbilityForGroup(group.id);
    const belowMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Space Wolves").id },
      detachmentForGroup(group),
      Array.from({ length: Math.max(0, group.minRosterLimit - 1) }, (_, unitIndex) => (
        allegianceUnit({ id: `min-${index}-below-${unitIndex}`, group, abilities: [ability] })
      )),
      belowMessages
    );
    assert.ok(
      messageCodes(belowMessages).includes("allegiance_ability.group_limit_not_reached"),
      `${group.name} should require at least ${group.minRosterLimit} selections`
    );

    const atMinMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Space Wolves").id },
      detachmentForGroup(group),
      Array.from({ length: group.minRosterLimit }, (_, unitIndex) => (
        allegianceUnit({ id: `min-${index}-valid-${unitIndex}`, group, abilities: [ability] })
      )),
      atMinMessages
    );
    assert.ok(
      !messageCodes(atMinMessages).includes("allegiance_ability.group_limit_not_reached"),
      `${group.name} should pass at its minimum roster limit`
    );
  }

  for (const [index, group] of maxGroups.entries()) {
    const ability = firstAbilityForGroup(group.id);
    const atMaxMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Space Wolves").id },
      detachmentForGroup(group),
      Array.from({ length: group.maxRosterLimit }, (_, unitIndex) => (
        allegianceUnit({ id: `max-${index}-valid-${unitIndex}`, group, abilities: [ability] })
      )),
      atMaxMessages
    );
    assert.ok(
      !messageCodes(atMaxMessages).includes("allegiance_ability.group_limit_exceeded"),
      `${group.name} should pass at its maximum roster limit`
    );

    const overMessages = [];
    validateAllegianceAbilities(
      { factionKeywordId: factionNamed("Space Wolves").id },
      detachmentForGroup(group),
      Array.from({ length: group.maxRosterLimit + 1 }, (_, unitIndex) => (
        allegianceUnit({ id: `max-${index}-over-${unitIndex}`, group, abilities: [ability] })
      )),
      overMessages
    );
    assert.ok(
      messageCodes(overMessages).includes("allegiance_ability.group_limit_exceeded"),
      `${group.name} should fail above its maximum roster limit`
    );
  }
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
