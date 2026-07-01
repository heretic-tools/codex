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

test("Cthonian Beserks duplicate-name Heavy plasma axe all-model rule stays valid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Cthonian Beserks");
  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("’Ardmob Boyz duplicate-name Big Choppa loadout bridge stays valid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("’Ardmob Boyz");
  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("Cthonian Beserks mixed base all-model weapons are invalid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Cthonian Beserks");
  const beserk = miniatureInUnit(unit, "Cthonian Beserk");
  setMiniatureWargear(unit, beserk, {
    "Heavy plasma axe": 4,
    "Concussion maul": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("Eliminator Sergeant substitute weapon does not break all-model matching", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Eliminator Squad");
  const sergeant = miniatureInUnit(unit, "Eliminator Sergeant");
  setMiniatureWargear(unit, sergeant, {
    "Close combat weapon": 1,
    "Bolt pistol": 1,
    "Instigator bolt carbine": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("Eliminator non-sergeant mixed all-model weapons are invalid", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Eliminator Squad");
  const eliminator = miniatureInUnit(unit, "Eliminator");
  setMiniatureWargear(unit, eliminator, {
    "Close combat weapon": 2,
    "Bolt pistol": 2,
    "Bolt sniper rifle": 1,
    "Las fusil": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("Termagant limited wargear thresholds scale with model count", () => {
  state.catalog = realCatalog;
  const tenTermagants = defaultWargearUnit("Termagants");
  const tenModels = miniatureInUnit(tenTermagants, "Termagant");
  setMiniatureWargear(tenTermagants, tenModels, {
    "Chitinous claws and teeth": 10,
    "Fleshborer": 8,
    "Strangleweb": 2,
  });

  const invalidMessages = [];
  validateWargearLoadouts([tenTermagants], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const twentyTermagants = defaultWargearUnit("Termagants");
  const twentyModels = miniatureInUnit(twentyTermagants, "Termagant");
  twentyModels.count = 20;
  twentyTermagants.modelCount = 20;
  setMiniatureWargear(twentyTermagants, twentyModels, {
    "Chitinous claws and teeth": 20,
    "Fleshborer": 18,
    "Strangleweb": 2,
  });

  const validMessages = [];
  validateWargearLoadouts([twentyTermagants], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("zero-count miniatures cannot keep selected wargear", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Termagants");
  const termagant = miniatureInUnit(unit, "Termagant");
  termagant.count = 0;
  unit.modelCount = 0;
  setMiniatureWargear(unit, termagant, {
    "Chitinous claws and teeth": 1,
    "Fleshborer": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(messageCodes(messages).includes("wargear_loadout.zero_count_model_wargear"));
});

test("wargear validation reports invalid unit scope, invalid model scope, and unit/model loadout failures", () => {
  state.catalog = realCatalog;

  const unitScopedModelOption = defaultWargearUnit("Termagants");
  const scopedTermagant = miniatureInUnit(unitScopedModelOption, "Termagant");
  unitScopedModelOption.wargear = {
    [optionIdForMiniatureItem(unitScopedModelOption.datasheetId, scopedTermagant.miniatureId, "Fleshborer")]: 1,
  };
  const unitScopeMessages = [];
  validateWargearLoadouts([unitScopedModelOption], unitScopeMessages);
  assert.ok(messageCodes(unitScopeMessages).includes("wargear_loadout.invalid_unit_wargear"));

  const modelScopedForeignOption = defaultWargearUnit("Termagants");
  const foreignTermagant = miniatureInUnit(modelScopedForeignOption, "Termagant");
  const eliminatorMiniature = miniatureNamedForDatasheet("Eliminator Squad", "Eliminator");
  foreignTermagant.wargear = {
    [optionIdForMiniatureItem(datasheetNamed("Eliminator Squad").id, eliminatorMiniature.id, "Bolt sniper rifle")]: 1,
  };
  const modelScopeMessages = [];
  validateWargearLoadouts([modelScopedForeignOption], modelScopeMessages);
  assert.ok(messageCodes(modelScopeMessages).includes("wargear_loadout.invalid_model_wargear"));

  const invalidMiniatureLoadout = defaultWargearUnit("Termagants");
  const loadoutTermagant = miniatureInUnit(invalidMiniatureLoadout, "Termagant");
  setMiniatureWargear(invalidMiniatureLoadout, loadoutTermagant, {
    "Chitinous claws and teeth": 10,
  });
  const miniatureLoadoutMessages = [];
  validateWargearLoadouts([invalidMiniatureLoadout], miniatureLoadoutMessages);
  assert.ok(messageCodes(miniatureLoadoutMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));

  const invalidUnitLoadout = defaultWargearUnit("Breacher Team");
  invalidUnitLoadout.wargear = {};
  const unitLoadoutMessages = [];
  validateWargearLoadouts([invalidUnitLoadout], unitLoadoutMessages);
  assert.ok(messageCodes(unitLoadoutMessages).includes("wargear_loadout.invalid_unit_wargear_loadout"));
});
