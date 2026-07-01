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
  canonicalWargearKey,
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

function addNameAliasContext(contexts, { source, datasheetId, miniatureId, wargearItemId }) {
  const key = canonicalWargearKey(wargearItemId, { datasheetId, miniatureId });
  if (!key.startsWith("name:")) {
    return;
  }
  const contextKey = `${datasheetId}|${miniatureId || ""}|${key}`;
  if (!contexts.has(contextKey)) {
    contexts.set(contextKey, {
      datasheet: realCatalog.datasheetById.get(datasheetId)?.name,
      miniature: realCatalog.miniatureById.get(miniatureId)?.name || "<unit>",
      key,
      itemIds: new Set(),
      sources: new Set(),
    });
  }
  const context = contexts.get(contextKey);
  context.itemIds.add(wargearItemId);
  context.sources.add(source);
}

function auditedNameAliasContexts() {
  const contexts = new Map();
  for (const set of realCatalog.loadoutChoiceSets || []) {
    for (const choice of realCatalog.loadoutChoicesBySetId.get(set.id) || []) {
      for (const row of realCatalog.loadoutChoiceItemsByChoiceId.get(choice.id) || []) {
        addNameAliasContext(contexts, {
          source: "loadout",
          datasheetId: set.datasheetId,
          miniatureId: set.miniatureId,
          wargearItemId: row.wargearItemId,
        });
      }
    }
  }
  for (const set of realCatalog.limitedWargearChoiceSets || []) {
    for (const choice of realCatalog.limitedWargearChoicesBySetId.get(set.id) || []) {
      for (const row of realCatalog.limitedWargearChoiceItemsByChoiceId.get(choice.id) || []) {
        addNameAliasContext(contexts, {
          source: "limited",
          datasheetId: set.datasheetId,
          miniatureId: set.miniatureId,
          wargearItemId: row.wargearItemId,
        });
      }
    }
  }
  for (const set of realCatalog.allModelWargearChoiceSets || []) {
    for (const choice of realCatalog.allModelWargearChoicesBySetId.get(set.id) || []) {
      for (const row of realCatalog.allModelWargearChoiceItemsByChoiceId.get(choice.id) || []) {
        addNameAliasContext(contexts, {
          source: "all_model",
          datasheetId: set.datasheetId,
          miniatureId: set.miniatureId,
          wargearItemId: row.wargearItemId,
        });
      }
    }
  }
  for (const group of realCatalog.wargearGroups || []) {
    for (const option of realCatalog.wargearOptionsByGroupId.get(group.id) || []) {
      addNameAliasContext(contexts, {
        source: "option",
        datasheetId: group.datasheetId,
        miniatureId: group.miniatureId,
        wargearItemId: option.wargearItemId,
      });
    }
  }
  return [...contexts.values()]
    .map((context) => ({
      datasheet: context.datasheet,
      miniature: context.miniature,
      key: context.key,
      itemIds: context.itemIds.size,
      sources: [...context.sources].sort(),
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

test("canonical wargear keys use item IDs except confirmed same-context duplicate bridges", () => {
  state.catalog = realCatalog;

  const termagants = datasheetNamed("Termagants");
  const termagant = miniatureNamedForDatasheet("Termagants", "Termagant");
  const fleshborerOption = realCatalog.wargearOptionById.get(
    optionIdForMiniatureItem(termagants.id, termagant.id, "Fleshborer")
  );
  const fleshborerKey = canonicalWargearKey(fleshborerOption.wargearItemId, {
    datasheetId: termagants.id,
    miniatureId: termagant.id,
  });
  assert.match(fleshborerKey, /^id:/);

  const beserks = datasheetNamed("Cthonian Beserks");
  const beserk = miniatureNamedForDatasheet("Cthonian Beserks", "Cthonian Beserk");
  const plasmaAxeOption = realCatalog.wargearOptionById.get(
    optionIdForMiniatureItem(beserks.id, beserk.id, "Heavy plasma axe")
  );
  const allModelSet = realCatalog.allModelWargearChoiceSets.find((row) => (
    row.datasheetId === beserks.id && row.miniatureId === beserk.id
  ));
  assert.ok(allModelSet, "Expected Cthonian Beserks all-model choice set");
  const allModelChoiceIds = (realCatalog.allModelWargearChoicesBySetId.get(allModelSet.id) || [])
    .map((row) => row.id);
  const plasmaAxeChoiceItem = allModelChoiceIds
    .flatMap((choiceId) => realCatalog.allModelWargearChoiceItemsByChoiceId.get(choiceId) || [])
    .find((row) => realCatalog.wargearItemById.get(row.wargearItemId)?.name === "Heavy plasma axe");
  assert.ok(plasmaAxeChoiceItem, "Expected Cthonian Beserks Heavy plasma axe all-model choice item");

  const context = { datasheetId: beserks.id, miniatureId: beserk.id };
  const optionKey = canonicalWargearKey(plasmaAxeOption.wargearItemId, context);
  const choiceKey = canonicalWargearKey(plasmaAxeChoiceItem.wargearItemId, context);
  assert.equal(optionKey, "name:heavy plasma axe");
  assert.equal(choiceKey, optionKey);
});

test("canonical name aliases are limited to audited duplicate-name bridges", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.wargearAliases.length, 4);
  assert.deepEqual(auditedNameAliasContexts(), [
    {
      datasheet: "’Ardmob Boyz",
      miniature: "Boss Nob",
      key: "name:big choppa",
      itemIds: 2,
      sources: ["loadout", "option"],
    },
    {
      datasheet: "Cthonian Beserks",
      miniature: "Cthonian Beserk",
      key: "name:heavy plasma axe",
      itemIds: 2,
      sources: ["all_model", "loadout", "option"],
    },
  ]);
});

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

test("all-model substitute choices require an active base choice", () => {
  state.catalog = realCatalog;
  const macrocytes = defaultWargearUnit("Canoptek Macrocytes");
  const macrocyte = miniatureInUnit(macrocytes, "Canoptek Macrocytes");
  setMiniatureWargear(macrocytes, macrocyte, {
    Claws: 5,
    "Accelerator Mandible": 5,
  });

  const invalidMessages = [];
  validateWargearLoadouts([macrocytes], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const yaegirs = defaultWargearUnit("Hernkyn Yaegirs");
  const yaegir = miniatureInUnit(yaegirs, "Hernkyn Yaegir");
  setMiniatureWargear(yaegirs, yaegir, {
    "Close combat weapon": 9,
    "Bolt shotgun": 8,
    "APM launcher": 1,
  });

  const validMessages = [];
  validateWargearLoadouts([yaegirs], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("all-model substitutes are anchored to their own substitute family", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Einhyr Hearthguard");
  const hesyr = miniatureInUnit(unit, "Hesyr");
  const hearthguard = miniatureInUnit(unit, "Einhyr Hearthguard");
  setMiniatureWargear(unit, hesyr, {
    "EtaCarn plasma gun": 1,
    "Weavefield crest": 1,
    "Exoarmour grenade launcher": 1,
    "Graviton hammer": 1,
  });
  setMiniatureWargear(unit, hearthguard, {
    "EtaCarn plasma gun": 4,
    "Exoarmour grenade launcher": 4,
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

test("limited wargear thresholds use total unit model count and duplicate caps", () => {
  state.catalog = realCatalog;
  const validShockTroops = defaultWargearUnit("Cadian Shock Troops");
  const validTrooper = miniatureInUnit(validShockTroops, "Shock Trooper");
  const validSergeant = miniatureInUnit(validShockTroops, "Shock Trooper Sergeant");
  validTrooper.count = 18;
  validSergeant.count = 2;
  validShockTroops.modelCount = 20;
  setMiniatureWargear(validShockTroops, validTrooper, {
    "Close combat weapon": 18,
    Lasgun: 14,
    Flamer: 1,
    "Grenade launcher": 1,
    Meltagun: 1,
    "Plasma gun": 1,
  });
  setMiniatureWargear(validShockTroops, validSergeant, {
    Chainsword: 2,
    Laspistol: 2,
  });

  const validMessages = [];
  validateWargearLoadouts([validShockTroops], validMessages);
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(validMessages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));

  const duplicateShockTroops = defaultWargearUnit("Cadian Shock Troops");
  const duplicateTrooper = miniatureInUnit(duplicateShockTroops, "Shock Trooper");
  const duplicateSergeant = miniatureInUnit(duplicateShockTroops, "Shock Trooper Sergeant");
  duplicateTrooper.count = 18;
  duplicateSergeant.count = 2;
  duplicateShockTroops.modelCount = 20;
  setMiniatureWargear(duplicateShockTroops, duplicateTrooper, {
    "Close combat weapon": 18,
    Lasgun: 14,
    Flamer: 1,
    "Plasma gun": 3,
  });
  setMiniatureWargear(duplicateShockTroops, duplicateSergeant, {
    Chainsword: 2,
    Laspistol: 2,
  });

  const duplicateMessages = [];
  validateWargearLoadouts([duplicateShockTroops], duplicateMessages);
  assert.ok(messageCodes(duplicateMessages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("limited wargear choices with overlapping combo rows use exact cover", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Battle Sisters Squad");
  const battleSister = miniatureInUnit(unit, "Battle Sister");
  setMiniatureWargear(unit, battleSister, {
    "Bolt pistol": 9,
    "Close combat weapon": 9,
    Boltgun: 7,
    "Heavy bolter": 1,
    "Ministorum flamer": 1,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
  assert.ok(!messageCodes(messages).includes("wargear_loadout.invalid_miniature_wargear_loadout"));
});

test("limited choices with base wargear do not invalidate default loadouts", () => {
  state.catalog = realCatalog;
  const pathfinders = defaultWargearUnit("Pathfinder Team");

  const pathfinderMessages = [];
  validateWargearLoadouts([pathfinders], pathfinderMessages);
  assert.ok(!messageCodes(pathfinderMessages).includes("wargear_loadout.invalid_wargear_requirement"));

  const tankbustas = defaultWargearUnit("Tankbustas");
  const tankbustaMessages = [];
  validateWargearLoadouts([tankbustas], tankbustaMessages);
  assert.ok(!messageCodes(tankbustaMessages).includes("wargear_loadout.invalid_wargear_requirement"));
});

test("default-only limited choices still count toward limited caps", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Hyperadapted Raveners");
  const raveners = miniatureInUnit(unit, "Raveners");
  setMiniatureWargear(unit, raveners, {
    "Ravener heavy claws and talons": 4,
    "Venom bolt": 2,
  });

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(messageCodes(messages).includes("wargear_loadout.invalid_wargear_requirement"));
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

test("default zero-count miniatures start without selected wargear", () => {
  state.catalog = realCatalog;
  const unit = defaultWargearUnit("Fortis Kill Team");
  const zeroCountMiniatures = unit.miniatures.filter((miniature) => miniature.count === 0);
  assert.ok(zeroCountMiniatures.length, "Expected a default optional miniature in Fortis Kill Team");
  assert.ok(zeroCountMiniatures.every((miniature) => !Object.keys(miniature.wargear || {}).length));

  const messages = [];
  validateWargearLoadouts([unit], messages);
  assert.ok(!messageCodes(messages).includes("wargear_loadout.zero_count_model_wargear"));
});

test("default catalog wargear loadouts do not self-validate as invalid", () => {
  state.catalog = realCatalog;
  const invalid = [];
  for (const datasheet of realCatalog.datasheets) {
    const compositions = realCatalog.compositionsByDatasheetId.get(datasheet.id) || [];
    const composition = compositions.find((item) => item.isDefault) || compositions[0];
    if (!composition) {
      continue;
    }
    const miniatures = defaultMiniatures(datasheet.id, composition.id).map((miniature, index) => ({
      ...miniature,
      id: `${datasheet.id}:${miniature.miniatureId}:${index}`,
      rosterUnitMiniatureId: `${datasheet.id}:${miniature.miniatureId}:${index}`,
      name: realCatalog.miniatureById.get(miniature.miniatureId)?.name || "Model",
    }));
    const unit = {
      id: datasheet.id,
      name: datasheet.name,
      datasheetId: datasheet.id,
      modelCount: miniatures.reduce((total, miniature) => total + (miniature.count || 0), 0),
      wargear: defaultWargear(datasheet.id, composition.id),
      unitWargear: {},
      miniatures,
    };
    const messages = [];
    validateWargearLoadouts([unit], messages);
    const codes = messageCodes(messages);
    if (codes.length) {
      invalid.push({
        datasheet: datasheet.name,
        publication: realCatalog.publicationById.get(datasheet.publicationId)?.name,
        codes: [...new Set(codes)],
      });
    }
  }

  assert.deepEqual(invalid, []);
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
