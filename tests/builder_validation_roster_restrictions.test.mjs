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
  });
});

test("detachment and composition validators cover unique, excluded, linked, and invalid composition cases", () => {
  state.catalog = realCatalog;

  const uniqueMessages = [];
  validateDetachmentUniqueKeywords([
    detachmentNamed("Kabalite Agonysts"),
    detachmentNamed("Kabalite Cartel"),
  ], uniqueMessages);
  assert.ok(messageCodes(uniqueMessages).includes("roster.detachment_unique_keyword_error"));

  const shadowLegion = detachmentNamed("Shadow Legion");
  const excludedRow = realCatalog.detachmentExcludedDatasheets.find((row) => (
    row.detachmentId === shadowLegion.id
    && realCatalog.datasheetById.get(row.datasheetId)?.name === "Kairos Fateweaver"
  ));
  assert.ok(excludedRow, "Expected Shadow Legion to exclude Kairos Fateweaver");
  const excludedMessages = [];
  validateDetachmentDatasheets(
    [shadowLegion],
    [rosterUnitFromDatasheetId(excludedRow.datasheetId, "kairos")],
    excludedMessages
  );
  assert.ok(messageCodes(excludedMessages).includes("detachment.datasheet_not_allowed"));

  const purgeCorps = detachmentNamed("Purge Corps Deltic-9");
  const linkedMessages = [];
  validateDetachmentDatasheets(
    [purgeCorps],
    [enhancementTargetUnit({
      id: "wrong-combat-patrol-unit",
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
    })],
    linkedMessages
  );
  assert.ok(messageCodes(linkedMessages).includes("detachment.linked_datasheet_count_mismatch"));
  assert.ok(messageCodes(linkedMessages).includes("detachment.linked_datasheet_not_allowed"));

  const compositionMessages = [];
  validateUnitCompositions([
    { id: "too-many", name: "Too Many", modelCount: 11, maxModelCount: 10, selectedCompositionId: "composition", selectedCompositionAvailable: true },
    { id: "missing-composition", name: "Missing Composition", modelCount: 1, maxModelCount: 10, selectedCompositionId: "", selectedCompositionAvailable: false },
    { id: "unavailable-composition", name: "Unavailable Composition", modelCount: 1, maxModelCount: 10, selectedCompositionId: "composition", selectedCompositionAvailable: false },
  ], compositionMessages);
  assert.ok(messageCodes(compositionMessages).includes("unit.max_model_count_too_many_models"));
  assert.ok(messageCodes(compositionMessages).includes("unit_composition.invalid_unit_composition"));
  assert.ok(messageCodes(compositionMessages).includes("unit_composition.unavailable"));

  withCatalog({
    detachmentExcludedDatasheets: [],
    detachmentRequiredDatasheetsByDetachmentId: new Map([[
      "required-detachment",
      [{ datasheetId: "required-datasheet" }],
    ]]),
    datasheetById: new Map([["required-datasheet", { id: "required-datasheet", name: "Required Datasheet" }]]),
  }, () => {
    const requiredDatasheetMessages = [];
    validateDetachmentDatasheets(
      [{ id: "required-detachment", name: "Required Detachment", isCombatPatrol: false }],
      [],
      requiredDatasheetMessages
    );
    assert.ok(messageCodes(requiredDatasheetMessages).includes("detachment.datasheets_missing"));
  });
});

test("validateRoster reports roster-level detachment, points, Combat Patrol, native, and excluded datasheet failures", () => {
  state.catalog = realCatalog;

  const illegalDetachmentValidation = validateRoster({
    id: "illegal-detachment",
    name: "Illegal Detachment",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Kabalite Agonysts").id],
    units: [],
  });
  assert.ok(messageCodes(illegalDetachmentValidation.messages).includes("roster.detachment_not_allowed"));

  const pointsValidation = validateRoster({
    id: "over-points",
    name: "Over Points",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Incursion").id,
    detachmentIds: [detachmentNamed("Pactbound Zealots").id],
    units: [rosterUnitRef("Chaos Warlord Titan", "chaos-warlord-titan")],
  });
  assert.ok(messageCodes(pointsValidation.messages).includes("roster.points_limit_exceeded"));

  const combatPatrolDatasheet = combatPatrolDatasheetNamed("Assault Force Intercessor Squad");
  const combatPatrolValidation = validateRoster({
    id: "combat-patrol-unit",
    name: "Combat Patrol Unit",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Incursion").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [{ id: "assault-force-intercessors", datasheetId: combatPatrolDatasheet.id }],
  });
  assert.ok(messageCodes(combatPatrolValidation.messages).includes("roster.combat_patrol_datasheet"));

  const nonNativeValidation = validateRoster({
    id: "non-native",
    name: "Non Native",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [rosterUnitRef("Plague Marines", "plague-marines")],
  });
  assert.ok(messageCodes(nonNativeValidation.messages).includes("roster.unit_not_native"));

  const excludedValidation = validateRoster({
    id: "black-templars-librarian",
    name: "Black Templars Librarian",
    factionKeywordId: factionNamed("Black Templars").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [rosterUnitRef("Librarian", "librarian")],
  });
  assert.ok(messageCodes(excludedValidation.messages).includes("roster.faction_datasheet_not_allowed"));
});

test("validateRoster enforces duplicate datasheet limits for non-Battleline and Epic Heroes", () => {
  state.catalog = realCatalog;
  const rosterBase = {
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
  };

  const captainValidation = validateRoster({
    ...rosterBase,
    id: "captain-duplicates",
    name: "Captain Duplicates",
    units: [0, 1, 2, 3].map((index) => enhancementTargetUnit({
      id: `captain-${index}`,
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
      isWarlord: index === 0,
    })),
  });
  assert.ok(messageCodes(captainValidation.messages).includes("roster.unit_limit_exceeded"));

  const guillimanValidation = validateRoster({
    ...rosterBase,
    id: "epic-duplicates",
    name: "Epic Duplicates",
    units: [0, 1].map((index) => enhancementTargetUnit({
      id: `guilliman-${index}`,
      datasheetName: "Roboute Guilliman",
      miniatureName: "Roboute Guilliman",
      factionNames: ["Adeptus Astartes", "Ultramarines"],
      isWarlord: index === 0,
    })),
  });
  assert.ok(messageCodes(guillimanValidation.messages).includes("roster.unit_limit_exceeded"));
});

test("keyword restriction groups are inherited through roster faction parent scope", () => {
  const catalog = {
    factionKeywordById: new Map([
      ["child-faction", { id: "child-faction", name: "Child", parentFactionKeywordId: "parent-faction" }],
      ["parent-faction", { id: "parent-faction", name: "Parent", parentFactionKeywordId: "" }],
    ]),
    keywordById: new Map([["restricted-keyword", { id: "restricted-keyword", name: "Restricted" }]]),
    keywordRestrictionGroupsByFactionId: new Map([
      ["parent-faction", [{
        id: "parent-group",
        factionKeywordId: "parent-faction",
        limit: 0,
        excludedFactionKeywordId: "",
        requiresWarlordMiniatureId: "",
      }]],
    ]),
    keywordRestrictionGroups: [],
    keywordRestrictionGroupKeywordsByGroupId: new Map([
      ["parent-group", [{ keywordId: "restricted-keyword" }]],
    ]),
    restrictionGroupDetachmentLimitsByDetachmentId: new Map(),
  };
  withCatalog(catalog, () => {
    const messages = [];
    validateKeywordRestrictions({ factionKeywordId: "child-faction" }, [], [{
      id: "restricted-unit",
      name: "Restricted Unit",
      keywordIds: ["restricted-keyword"],
      factionKeywordIds: ["child-faction"],
      warlordMiniatureIds: [],
    }], messages);
    assert.ok(messageCodes(messages).includes("keyword_restriction_group.limit_zero"));
  });
});
