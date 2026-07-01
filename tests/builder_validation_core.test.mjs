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
