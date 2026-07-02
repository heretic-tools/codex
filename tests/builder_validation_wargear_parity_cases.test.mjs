import assert from "node:assert/strict";
import test from "node:test";
import {
  state,
  validateWargearLoadouts,
  realCatalog,
  messageCodes,
  datasheetNamed,
  defaultWargearUnit,
  miniatureInUnit,
  miniatureNamedForDatasheet,
  optionIdForMiniatureItem,
  setMiniatureWargear,
} from "./builder_validation_helpers.mjs";
import { validationConceptForCode, validationConceptKnown } from "./builder_validation_concepts.mjs";

const invalidWargearCodes = [
  "wargear_loadout.invalid_miniature_wargear_loadout",
  "wargear_loadout.invalid_model_wargear",
  "wargear_loadout.invalid_unit_wargear",
  "wargear_loadout.invalid_unit_wargear_loadout",
  "wargear_loadout.invalid_wargear_requirement",
  "wargear_loadout.zero_count_model_wargear",
];

function runWargearCases(cases) {
  state.catalog = realCatalog;
  for (const parityCase of cases) {
    assert.ok(validationConceptKnown(parityCase.officialConcept), `${parityCase.id} has unknown official concept`);
    const messages = [];
    validateWargearLoadouts(parityCase.units(), messages);
    const codes = messageCodes(messages);
    for (const code of parityCase.expectedCodes || []) {
      assert.ok(validationConceptForCode(code), `${parityCase.id} missing concept for ${code}`);
      assert.ok(codes.includes(code), `${parityCase.id} should emit ${code}; got ${codes.join(", ") || "<none>"}`);
      assert.equal(validationConceptForCode(code), parityCase.officialConcept, `${parityCase.id} concept mismatch for ${code}`);
    }
    for (const code of parityCase.forbiddenCodes || []) {
      assert.ok(validationConceptForCode(code), `${parityCase.id} missing concept for ${code}`);
      assert.ok(!codes.includes(code), `${parityCase.id} should not emit ${code}; got ${codes.join(", ") || "<none>"}`);
    }
  }
}

const wargearParityCases = [
  {
    id: "duplicate-name-cthonian-beserks-default-valid",
    officialConcept: "LoadoutKey",
    forbiddenCodes: invalidWargearCodes,
    units: () => [defaultWargearUnit("Cthonian Beserks")],
  },
  {
    id: "duplicate-name-ardmob-boyz-default-valid",
    officialConcept: "LoadoutKey",
    forbiddenCodes: invalidWargearCodes,
    units: () => [defaultWargearUnit("’Ardmob Boyz")],
  },
  {
    id: "all-model-mixed-base-invalid",
    officialConcept: "InvalidWargearRequirement",
    expectedCodes: ["wargear_loadout.invalid_wargear_requirement"],
    units: () => {
      const unit = defaultWargearUnit("Cthonian Beserks");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Cthonian Beserk"), {
        "Heavy plasma axe": 4,
        "Concussion maul": 1,
      });
      return [unit];
    },
  },
  {
    id: "cthonian-twin-concussion-gauntlet-limit-valid",
    officialConcept: "InvalidWargearRequirement",
    forbiddenCodes: invalidWargearCodes,
    units: () => {
      const unit = defaultWargearUnit("Cthonian Beserks");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Cthonian Beserk"), {
        "Heavy plasma axe": 4,
        "Twin concussion gauntlet": 1,
      });
      return [unit];
    },
  },
  {
    id: "cthonian-twin-concussion-gauntlet-over-limit-invalid",
    officialConcept: "InvalidWargearRequirement",
    expectedCodes: ["wargear_loadout.invalid_wargear_requirement"],
    units: () => {
      const unit = defaultWargearUnit("Cthonian Beserks");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Cthonian Beserk"), {
        "Heavy plasma axe": 3,
        "Twin concussion gauntlet": 2,
      });
      return [unit];
    },
  },
  {
    id: "all-model-eliminator-sergeant-substitute-valid",
    officialConcept: "InvalidWargearRequirement",
    forbiddenCodes: ["wargear_loadout.invalid_wargear_requirement", "wargear_loadout.invalid_miniature_wargear_loadout"],
    units: () => {
      const unit = defaultWargearUnit("Eliminator Squad");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Eliminator Sergeant"), {
        "Close combat weapon": 1,
        "Bolt pistol": 1,
        "Instigator bolt carbine": 1,
      });
      return [unit];
    },
  },
  {
    id: "all-model-eliminator-mixed-base-invalid",
    officialConcept: "InvalidWargearRequirement",
    expectedCodes: ["wargear_loadout.invalid_wargear_requirement"],
    units: () => {
      const unit = defaultWargearUnit("Eliminator Squad");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Eliminator"), {
        "Close combat weapon": 2,
        "Bolt pistol": 2,
        "Bolt sniper rifle": 1,
        "Las fusil": 1,
      });
      return [unit];
    },
  },
  {
    id: "all-model-substitute-without-base-invalid",
    officialConcept: "InvalidWargearRequirement",
    expectedCodes: ["wargear_loadout.invalid_wargear_requirement"],
    units: () => {
      const unit = defaultWargearUnit("Canoptek Macrocytes");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Canoptek Macrocytes"), {
        Claws: 5,
        "Accelerator Mandible": 5,
      });
      return [unit];
    },
  },
  {
    id: "all-model-termagant-base-plus-substitute-valid",
    officialConcept: "InvalidWargearRequirement",
    forbiddenCodes: ["wargear_loadout.invalid_wargear_requirement", "wargear_loadout.invalid_miniature_wargear_loadout"],
    units: () => {
      const unit = defaultWargearUnit("Termagants");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Termagant"), {
        "Chitinous claws and teeth": 10,
        Fleshborer: 9,
        Strangleweb: 1,
      });
      return [unit];
    },
  },
  {
    id: "all-model-substitute-with-active-base-valid",
    officialConcept: "InvalidWargearRequirement",
    forbiddenCodes: ["wargear_loadout.invalid_wargear_requirement"],
    units: () => {
      const unit = defaultWargearUnit("Hernkyn Yaegirs");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Hernkyn Yaegir"), {
        "Close combat weapon": 9,
        "Bolt shotgun": 8,
        "APM launcher": 1,
      });
      return [unit];
    },
  },
  {
    id: "alternate-loadout-replaces-regular-valid",
    officialConcept: "InvalidWargearLoadout",
    forbiddenCodes: ["wargear_loadout.invalid_miniature_wargear_loadout"],
    units: () => {
      const unit = defaultWargearUnit("Chaos Terminator Squad");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Terminator Champion"), {
        "Paired accursed weapons": 1,
      });
      return [unit];
    },
  },
  {
    id: "alternate-loadout-mixed-with-regular-invalid",
    officialConcept: "InvalidWargearLoadout",
    expectedCodes: ["wargear_loadout.invalid_miniature_wargear_loadout"],
    units: () => {
      const unit = defaultWargearUnit("Chaos Terminator Squad");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Terminator Champion"), {
        "Combi-bolter": 1,
        "Paired accursed weapons": 1,
      });
      return [unit];
    },
  },
  {
    id: "duplicate-allowed-loadout-valid",
    officialConcept: "InvalidWargearLoadout",
    forbiddenCodes: ["wargear_loadout.invalid_miniature_wargear_loadout"],
    units: () => {
      const unit = defaultWargearUnit("Deff Dread");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Deff Dread"), {
        "Stompy feet": 1,
        "Dread klaw": 4,
      });
      return [unit];
    },
  },
  {
    id: "duplicate-allowed-loadout-over-limit-invalid",
    officialConcept: "InvalidWargearLoadout",
    expectedCodes: ["wargear_loadout.invalid_miniature_wargear_loadout"],
    units: () => {
      const unit = defaultWargearUnit("Deff Dread");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Deff Dread"), {
        "Stompy feet": 1,
        "Dread klaw": 5,
      });
      return [unit];
    },
  },
  {
    id: "unit-scoped-limited-counts-across-models-valid",
    officialConcept: "InvalidWargearRequirement",
    forbiddenCodes: invalidWargearCodes,
    units: () => {
      const unit = defaultWargearUnit("Intercessor Squad");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Intercessor"), {
        "Bolt pistol": 4,
        "Bolt rifle": 4,
        "Close combat weapon": 4,
        "Astartes grenade launcher": 1,
      });
      return [unit];
    },
  },
  {
    id: "unit-scoped-limited-over-limit-invalid",
    officialConcept: "InvalidWargearRequirement",
    expectedCodes: ["wargear_loadout.invalid_wargear_requirement"],
    forbiddenCodes: ["wargear_loadout.invalid_miniature_wargear_loadout"],
    units: () => {
      const unit = defaultWargearUnit("Intercessor Squad");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Intercessor"), {
        "Bolt pistol": 4,
        "Bolt rifle": 4,
        "Close combat weapon": 4,
        "Astartes grenade launcher": 2,
      });
      return [unit];
    },
  },
  {
    id: "limited-threshold-ten-termagants-invalid",
    officialConcept: "InvalidWargearRequirement",
    expectedCodes: ["wargear_loadout.invalid_wargear_requirement"],
    units: () => {
      const unit = defaultWargearUnit("Termagants");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Termagant"), {
        "Chitinous claws and teeth": 10,
        Fleshborer: 8,
        Strangleweb: 2,
      });
      return [unit];
    },
  },
  {
    id: "limited-threshold-twenty-termagants-valid",
    officialConcept: "InvalidWargearRequirement",
    forbiddenCodes: invalidWargearCodes,
    units: () => {
      const unit = defaultWargearUnit("Termagants");
      const termagant = miniatureInUnit(unit, "Termagant");
      termagant.count = 20;
      unit.modelCount = 20;
      setMiniatureWargear(unit, termagant, {
        "Chitinous claws and teeth": 20,
        Fleshborer: 18,
        Strangleweb: 2,
      });
      return [unit];
    },
  },
  {
    id: "limited-overlapping-combo-exact-cover-valid",
    officialConcept: "InvalidWargearRequirement",
    forbiddenCodes: invalidWargearCodes,
    units: () => {
      const unit = defaultWargearUnit("Battle Sisters Squad");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Battle Sister"), {
        "Bolt pistol": 9,
        "Close combat weapon": 9,
        Boltgun: 7,
        "Heavy bolter": 1,
        "Ministorum flamer": 1,
      });
      return [unit];
    },
  },
  {
    id: "limited-default-component-default-loadouts-valid",
    officialConcept: "InvalidWargearRequirement",
    forbiddenCodes: ["wargear_loadout.invalid_wargear_requirement"],
    units: () => [defaultWargearUnit("Pathfinder Team"), defaultWargearUnit("Tankbustas")],
  },
  {
    id: "default-only-limited-cap-invalid",
    officialConcept: "InvalidWargearRequirement",
    expectedCodes: ["wargear_loadout.invalid_wargear_requirement"],
    units: () => {
      const unit = defaultWargearUnit("Hyperadapted Raveners");
      setMiniatureWargear(unit, miniatureInUnit(unit, "Raveners"), {
        "Ravener heavy claws and talons": 4,
        "Venom bolt": 2,
      });
      return [unit];
    },
  },
  {
    id: "zero-count-model-wargear-invalid",
    officialConcept: "WargearLoadoutValidator",
    expectedCodes: ["wargear_loadout.zero_count_model_wargear"],
    units: () => {
      const unit = defaultWargearUnit("Termagants");
      const termagant = miniatureInUnit(unit, "Termagant");
      termagant.count = 0;
      unit.modelCount = 0;
      setMiniatureWargear(unit, termagant, {
        "Chitinous claws and teeth": 1,
        Fleshborer: 1,
      });
      return [unit];
    },
  },
  {
    id: "invalid-unit-scope-wargear",
    officialConcept: "WargearLoadoutValidator",
    expectedCodes: ["wargear_loadout.invalid_unit_wargear"],
    units: () => {
      const unit = defaultWargearUnit("Termagants");
      const termagant = miniatureInUnit(unit, "Termagant");
      unit.wargear = {
        [optionIdForMiniatureItem(unit.datasheetId, termagant.miniatureId, "Fleshborer")]: 1,
      };
      return [unit];
    },
  },
  {
    id: "invalid-model-scope-wargear",
    officialConcept: "WargearLoadoutValidator",
    expectedCodes: ["wargear_loadout.invalid_model_wargear"],
    units: () => {
      const unit = defaultWargearUnit("Termagants");
      const termagant = miniatureInUnit(unit, "Termagant");
      const eliminator = miniatureNamedForDatasheet("Eliminator Squad", "Eliminator");
      termagant.wargear = {
        [optionIdForMiniatureItem(datasheetNamed("Eliminator Squad").id, eliminator.id, "Bolt sniper rifle")]: 1,
      };
      return [unit];
    },
  },
  {
    id: "invalid-unit-loadout",
    officialConcept: "InvalidWargearLoadout",
    expectedCodes: ["wargear_loadout.invalid_unit_wargear_loadout"],
    units: () => {
      const unit = defaultWargearUnit("Breacher Team");
      unit.wargear = {};
      return [unit];
    },
  },
];

test("minimum WH app wargear parity cases stay executable", () => {
  assert.equal(wargearParityCases.length, 25);
  assert.ok(wargearParityCases.every((parityCase) => parityCase.id && validationConceptKnown(parityCase.officialConcept)));
  runWargearCases(wargearParityCases);
});

export {
  runWargearCases,
  wargearParityCases,
};
