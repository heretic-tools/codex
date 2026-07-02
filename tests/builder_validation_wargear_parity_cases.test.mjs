import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  state,
  availableDetachments,
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

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = dirname(dirname(currentFile));
const shouldRegisterTests = process.argv.some((arg) => resolve(arg) === currentFile);

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

function wargearOptionSummary(optionId, count) {
  const option = realCatalog.wargearOptionById.get(optionId) || {};
  const item = realCatalog.wargearItemById.get(option.wargearItemId) || {};
  return {
    optionId,
    wargearItemId: option.wargearItemId || "",
    name: item.name || optionId,
    count: Number(count || 0),
  };
}

function wargearSummary(counts) {
  return Object.entries(counts || {})
    .filter(([, count]) => Number(count || 0) > 0)
    .map(([optionId, count]) => wargearOptionSummary(optionId, count))
    .sort((left, right) => (
      String(left.name).localeCompare(String(right.name))
      || String(left.optionId).localeCompare(String(right.optionId))
    ));
}

function manifestUnit(unit) {
  return {
    id: unit.id,
    name: unit.name,
    datasheetId: unit.datasheetId,
    modelCount: unit.modelCount,
    unitWargear: wargearSummary(unit.wargear),
    miniatures: (unit.miniatures || []).map((miniature) => ({
      rosterUnitMiniatureId: miniature.rosterUnitMiniatureId || miniature.id || "",
      miniatureId: miniature.miniatureId,
      name: miniature.name,
      count: Number(miniature.count || 0),
      wargear: wargearSummary(miniature.wargear),
    })),
  };
}

function uiSetupForUnit(unit) {
  const faction = (realCatalog.datasheetFactionKeywordsByDatasheetId.get(unit.datasheetId) || [])
    .map((row) => realCatalog.factionKeywordById.get(row.factionKeywordId))
    .filter((row) => row && !row.excludedFromArmyBuilder)
    .sort((left, right) => (
      String(left.name || "").localeCompare(String(right.name || ""))
    ))[0] || null;
  const detachment = faction ? availableDetachments(faction.id)[0] : null;
  return {
    comparisonScope: "wargear-only",
    datasheetId: unit.datasheetId,
    datasheetName: unit.name,
    rosterFactionId: faction?.id || "",
    rosterFactionName: faction?.name || "",
    battleSizeName: "Strike Force",
    detachmentId: detachment?.id || "",
    detachmentName: detachment?.name || "",
    note: "Compare only wargear-related diagnostics; satisfy or ignore unrelated roster-level Warlord/detachment errors.",
  };
}

function wargearParityManifest() {
  state.catalog = realCatalog;
  const cases = wargearParityCases.map((parityCase) => {
    const expectedCodes = parityCase.expectedCodes || [];
    const forbiddenCodes = parityCase.forbiddenCodes || [];
    const units = parityCase.units();
    return {
      id: parityCase.id,
      comparisonScope: "wargear-only",
      expectedState: expectedCodes.length ? "invalid" : "valid",
      officialConcept: parityCase.officialConcept,
      expectedCodes,
      forbiddenCodes,
      uiSetups: units.map(uiSetupForUnit),
      units: units.map(manifestUnit),
    };
  });
  return {
    dataVersion: realCatalog.bootstrap?.dataVersion || "",
    caseCount: wargearParityCases.length,
    setupCount: cases.reduce((total, parityCase) => total + parityCase.uiSetups.length, 0),
    cases,
  };
}

function execNodeWithoutParentCoverage(args) {
  const childEnv = { ...process.env };
  const childCoverageDir = childEnv.NODE_V8_COVERAGE
    ? mkdtempSync(join(tmpdir(), "heretic-builder-child-coverage-"))
    : null;
  if (childCoverageDir) {
    childEnv.NODE_V8_COVERAGE = childCoverageDir;
  }
  try {
    return execFileSync(process.execPath, args, {
      encoding: "utf8",
      env: childEnv,
      maxBuffer: 128 * 1024 * 1024,
    });
  } finally {
    if (childCoverageDir) {
      rmSync(childCoverageDir, { recursive: true, force: true });
    }
  }
}

if (shouldRegisterTests) {
  test("minimum WH app wargear parity cases stay executable", () => {
    assert.equal(wargearParityCases.length, 25);
    assert.ok(wargearParityCases.every((parityCase) => parityCase.id && validationConceptKnown(parityCase.officialConcept)));
    runWargearCases(wargearParityCases);
  });

  test("minimum WH app wargear parity manifest carries UI setup hints", () => {
    const manifest = wargearParityManifest();
    assert.equal(manifest.caseCount, 25);
    assert.equal(manifest.setupCount, 26);
    assert.ok(manifest.cases.every((parityCase) => parityCase.comparisonScope === "wargear-only"));
    assert.ok(manifest.cases.every((parityCase) => parityCase.uiSetups.length === parityCase.units.length));
    const setupLabels = manifest.cases.flatMap((parityCase) => (
      parityCase.uiSetups.map((setup) => (
        `${parityCase.id}: ${setup.rosterFactionName} / ${setup.detachmentName} / ${setup.datasheetName}`
      ))
    ));
    assert.ok(setupLabels.includes("limited-default-component-default-loadouts-valid: T’au Empire / Advanced Acquisition Cadre / Pathfinder Team"));
    assert.ok(setupLabels.includes("limited-default-component-default-loadouts-valid: Orks / More Dakka! / Tankbustas"));
    assert.deepEqual(
      manifest.cases.flatMap((parityCase) => parityCase.uiSetups)
        .filter((setup) => !setup.rosterFactionName || !setup.detachmentName),
      []
    );
  });

  test("manual WH app wargear UI setup doc tracks every manifest setup", () => {
    const manifest = wargearParityManifest();
    const setupDoc = readFileSync(join(projectRoot, "docs", "wh40k_app_wargear_ui_setups.md"), "utf8");

    assert.equal(manifest.setupCount, 26);
    for (const parityCase of manifest.cases) {
      for (const setup of parityCase.uiSetups) {
        const row = `| \`${parityCase.id}\` | ${setup.rosterFactionName} | ${setup.detachmentName} | ${setup.datasheetName} |`;
        assert.ok(setupDoc.includes(row), `${parityCase.id} missing setup row ${row}`);
      }
    }
  });

  test("wargear manifest export CLI emits JSON and markdown formats", () => {
    const exportTool = join(projectRoot, "HereticBuilder", "tools", "export_wargear_parity_manifest.mjs");
    const jsonManifest = JSON.parse(execNodeWithoutParentCoverage([exportTool, "--json"]));
    assert.equal(jsonManifest.caseCount, 25);
    assert.equal(jsonManifest.setupCount, 26);
    assert.equal(jsonManifest.cases[0].id, "duplicate-name-cthonian-beserks-default-valid");

    const markdown = execNodeWithoutParentCoverage([exportTool, "--format", "markdown"]);
    assert.ok(markdown.startsWith("# WH 40K app wargear parity setups"));
    assert.ok(markdown.includes("WH app UI setups: 26"));
    assert.ok(markdown.includes("| Case id | Expected | Codes | Roster faction | Detachment | Unit | Wargear setup | WH app state | WH app diagnostic | Parity |"));
    assert.ok(markdown.includes("| `invalid-unit-loadout` | invalid | wargear_loadout.invalid_unit_wargear_loadout | T’au Empire | Advanced Acquisition Cadre | Breacher Team |"));
    assert.ok(markdown.includes("| Pending | Pending | Pending |"));

    const resultsDir = mkdtempSync(join(tmpdir(), "heretic-builder-wargear-results-"));
    try {
      const pendingResultsPath = join(resultsDir, "pending.md");
      writeFileSync(pendingResultsPath, markdown);
      const pendingSummary = JSON.parse(execNodeWithoutParentCoverage([
        exportTool,
        "--check-results",
        pendingResultsPath,
        "--allow-pending",
      ]));
      assert.equal(pendingSummary.status, "pending");
      assert.equal(pendingSummary.parsedRows, 26);
      assert.equal(pendingSummary.pendingRows.length, 26);

      const filledMarkdown = markdown.split("\n").map((line) => {
        if (!line.startsWith("| `")) {
          return line;
        }
        const expectedState = line.includes(" | invalid | ") ? "invalid" : "valid";
        return line.replace(" | Pending | Pending | Pending |", ` | ${expectedState} | manual app diagnostic | match |`);
      }).join("\n");
      const filledResultsPath = join(resultsDir, "filled.md");
      writeFileSync(filledResultsPath, filledMarkdown);
      const matchSummary = JSON.parse(execNodeWithoutParentCoverage([
        exportTool,
        "--check-results",
        filledResultsPath,
      ]));
      assert.equal(matchSummary.status, "match");
      assert.equal(matchSummary.parsedRows, 26);
      assert.equal(matchSummary.pendingRows.length, 0);

      const mismatchResultsPath = join(resultsDir, "mismatch.md");
      writeFileSync(
        mismatchResultsPath,
        filledMarkdown.replace(" | valid | manual app diagnostic | match |", " | invalid | manual app diagnostic | mismatch |")
      );
      assert.throws(
        () => execNodeWithoutParentCoverage([exportTool, "--check-results", mismatchResultsPath]),
        (error) => {
          const mismatchSummary = JSON.parse(error.stdout);
          assert.equal(mismatchSummary.status, "mismatch");
          assert.equal(mismatchSummary.stateMismatches.length, 1);
          return true;
        }
      );
    } finally {
      rmSync(resultsDir, { recursive: true, force: true });
    }
  });
}

export {
  runWargearCases,
  wargearParityManifest,
  wargearParityCases,
};
