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

test("validateRoster emits stable codes for real catalog messages", () => {
  state.catalog = realCatalog;
  const validation = validateRoster({
    id: "test-roster",
    name: "Empty Test Roster",
    factionKeywordId: realCatalog.bootstrap.defaultFactionId,
    battleSizeId: realCatalog.bootstrap.defaultBattleSizeId,
    detachmentIds: [],
    units: [],
  });

  assert.ok(validation.messages.length > 0);
  assert.ok(validation.messages.every((message) => typeof message.code === "string" && message.code.length > 0));
  assert.deepEqual(messageCodes(validation.messages), [
    "roster.detachment_not_selected",
    "roster.empty",
  ]);
});

test("factionScope walks the full faction keyword table, including hidden parents", () => {
  withCatalog({
    factionKeywordById: new Map([
      ["child", { id: "child", parentFactionKeywordId: "hidden-parent" }],
      ["hidden-parent", { id: "hidden-parent", parentFactionKeywordId: "" }],
    ]),
    factionById: new Map([
      ["child", { id: "child", parentFactionKeywordId: "hidden-parent" }],
    ]),
  }, () => {
    assert.deepEqual(factionScope("child"), ["child", "hidden-parent"]);
  });
});

test("conditional keywords match required roster faction through parent scope", () => {
  const composition = { id: "composition", datasheetId: "datasheet", points: 0, isDefault: true, displayOrder: 1 };
  withCatalog({
    datasheetById: new Map([["datasheet", { id: "datasheet", name: "Datasheet", maxModelCount: 1 }]]),
    compositionById: new Map([[composition.id, composition]]),
    compositionsByDatasheetId: new Map([["datasheet", [composition]]]),
    compositionMiniaturesByCompositionId: new Map([[composition.id, [{ miniatureId: "miniature", min: 1, max: 1 }]]]),
    requiredFactionKeywordsByCompositionId: new Map(),
    requiredDetachmentsByCompositionId: new Map(),
    miniatureById: new Map([["miniature", { id: "miniature", name: "Miniature" }]]),
    miniatureKeywordsByMiniatureId: new Map([["miniature", []]]),
    miniaturesByDatasheetId: new Map([["datasheet", [{ id: "miniature", datasheetId: "datasheet", name: "Miniature" }]]]),
    conditionalKeywordsByDatasheetId: new Map([[
      "datasheet",
      [{ datasheetId: "datasheet", keywordId: "conditional-keyword", requiredRosterFactionKeywordId: "parent" }],
    ]]),
    keywordById: new Map([["conditional-keyword", { id: "conditional-keyword", name: "Conditional" }]]),
    factionKeywordById: new Map([
      ["child", { id: "child", parentFactionKeywordId: "parent" }],
      ["parent", { id: "parent", parentFactionKeywordId: "" }],
    ]),
    allegianceAbilityById: new Map(),
    enhancementById: new Map(),
    datasheetPointsStepsByDatasheetId: new Map(),
    wargearOptionById: new Map(),
    datasheetFactionKeywordsByDatasheetId: new Map(),
  }, () => {
    const summary = unitSummary({
      factionKeywordId: "child",
      detachmentIds: [],
      units: [{
        id: "unit",
        datasheetId: "datasheet",
        miniatures: [{ miniatureId: "miniature", count: 1 }],
      }],
    }, {
      id: "unit",
      datasheetId: "datasheet",
      miniatures: [{ miniatureId: "miniature", count: 1 }],
    });
    assert.ok(summary.keywordIds.includes("conditional-keyword"));
    assert.ok(summary.conditionalKeywordIds.includes("conditional-keyword"));
  });
});
