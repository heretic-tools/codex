import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  OFFICIAL_VALIDATION_KEY_TO_CODE,
  VALIDATION_CONCEPT_BY_CODE,
  validationConceptForCode,
} from "./builder_validation_concepts.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const OFFICIAL_APP_BINARY_PATH =
  "/Applications/WH 40K.app/Wrapper/w40.app/w40";
const OFFICIAL_DATASOURCE_STRINGS_PATH =
  "/Applications/WH 40K.app/Wrapper/w40.app/Datasource_BattleForgeDatasource.bundle/en.lproj/Localizable.strings";
const OFFICIAL_UI_STRINGS_PATH =
  "/Applications/WH 40K.app/Wrapper/w40.app/UI_BattleForgeUI.bundle/en.lproj/Localizable.strings";

const OFFICIAL_DATASOURCE_VALIDATION_KEY_PATTERN =
  /^(allegiance_ability|allied_|attach_|attached_|conditional_keyword|detachment_|enhancement|invalid_warlord|keyword_restriction|mandatory_warlord|max_model|roster_|successor|unit_composition|wargear_loadout|warlord_validator)/;

const OFFICIAL_BATTLEFORGE_VALIDATOR_SYMBOLS = [
  "AllegianceAbilityGroupRosterLimitValidator",
  "AllegianceAbilityValidator",
  "AlliedFactionDetachmentValidator",
  "AlliedKeywordCountValidator",
  "AlliedPointsValidator",
  "AlliedUnitsRequiredAllegianceValidator",
  "AlliedUnitsRequiredWarlordValidator",
  "DetachmentExcludedDatasheetValidator",
  "DetachmentPointsLimitValidator",
  "DetachmentRequiredDatasheetValidator",
  "EnhancementValidator",
  "FactionKeywordExcludedDatasheetValidator",
  "KeywordAllyRestrictingKeywordValidator",
  "KeywordRestrictionGroupValidator",
  "MandatoryWarlordValidator",
  "MaxModelCountValidator",
  "RosterAttachedUnitValidator",
  "RosterDetachmentValidator",
  "RosterPointsValidator",
  "RosterUnitLimitValidator",
  "UnitCompositionValidator",
  "WargearLoadoutValidator",
  "WarlordValidator",
];

function plistKeys(path) {
  const output = execFileSync("plutil", ["-convert", "json", "-o", "-", path], { encoding: "utf8" });
  return Object.keys(JSON.parse(output));
}

function officialBattleForgeValidatorSymbols(path) {
  const output = execFileSync("strings", ["-a", path], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return [...new Set(output.split(/\r?\n/)
    .filter((line) => /^[A-Z][A-Za-z0-9]+Validator$/.test(line))
    .filter((line) => !/^(APM|IDToken|JWT|ListAuthenticators|Request)/.test(line))
    .filter((line) => line !== "Validator"))]
    .sort();
}

test("every Builder validation code is covered by a focused validation test", async () => {
  const staticDir = join(projectRoot, "HereticBuilder", "static");
  const staticFiles = (await readdir(staticDir))
    .filter((fileName) => fileName.endsWith(".js"));

  const sourceCodes = new Set();
  for (const fileName of staticFiles) {
    const source = await readFile(join(staticDir, fileName), "utf8");
    for (const match of source.matchAll(/validation(?:Message|Warning)\(\s*"([^"]+)"/g)) {
      sourceCodes.add(match[1]);
    }
  }

  const testsDir = join(projectRoot, "tests");
  const testFiles = (await readdir(testsDir))
    .filter((fileName) => fileName.startsWith("builder_validation_"))
    .filter((fileName) => fileName.endsWith(".test.mjs"))
    .filter((fileName) => fileName !== "builder_validation_coverage.test.mjs");

  const assertedCodes = new Set();
  for (const fileName of testFiles) {
    const source = await readFile(join(testsDir, fileName), "utf8");
    for (const match of source.matchAll(/["']([a-z0-9_.]+)["']/g)) {
      if (match[1].includes(".")) {
        assertedCodes.add(match[1]);
      }
    }
  }

  const missingCodes = [...sourceCodes]
    .filter((code) => !assertedCodes.has(code))
    .sort();

  assert.deepEqual(missingCodes, []);

  const missingConceptCodes = [...sourceCodes]
    .filter((code) => !validationConceptForCode(code))
    .sort();

  assert.deepEqual(missingConceptCodes, []);
});

test("wargear validation codes preserve official loadout and requirement concepts", () => {
  assert.equal(validationConceptForCode("wargear_loadout.invalid_miniature_wargear_loadout"), "InvalidWargearLoadout");
  assert.equal(validationConceptForCode("wargear_loadout.invalid_unit_wargear_loadout"), "InvalidWargearLoadout");
  assert.equal(validationConceptForCode("wargear_loadout.invalid_wargear_requirement"), "InvalidWargearRequirement");
});

test("official WH app validation localization keys map to Builder codes", () => {
  assert.equal(Object.keys(OFFICIAL_VALIDATION_KEY_TO_CODE).length, 56);

  const unmappedCodes = Object.entries(OFFICIAL_VALIDATION_KEY_TO_CODE)
    .filter(([, code]) => !validationConceptForCode(code))
    .map(([key, code]) => `${key} -> ${code}`)
    .sort();

  assert.deepEqual(unmappedCodes, []);
});

test(
  "local official WH app validation localization keys stay mapped",
  {
    skip: !(existsSync(OFFICIAL_DATASOURCE_STRINGS_PATH) && existsSync(OFFICIAL_UI_STRINGS_PATH)) &&
      "official WH 40K app localization bundles are not available on this machine",
  },
  () => {
    const datasourceKeys = plistKeys(OFFICIAL_DATASOURCE_STRINGS_PATH)
      .filter((key) => OFFICIAL_DATASOURCE_VALIDATION_KEY_PATTERN.test(key));
    const uiKeys = plistKeys(OFFICIAL_UI_STRINGS_PATH)
      .filter((key) => key === "invalid_warlord_generic");
    const officialKeys = [...new Set([...datasourceKeys, ...uiKeys])].sort();

    assert.deepEqual(officialKeys, Object.keys(OFFICIAL_VALIDATION_KEY_TO_CODE).sort());
  }
);

test(
  "local official WH app Battle Forge validator symbols stay mapped",
  {
    skip: !existsSync(OFFICIAL_APP_BINARY_PATH) &&
      "official WH 40K app binary is not available on this machine",
  },
  () => {
    const officialSymbols = officialBattleForgeValidatorSymbols(OFFICIAL_APP_BINARY_PATH);

    assert.deepEqual(officialSymbols, OFFICIAL_BATTLEFORGE_VALIDATOR_SYMBOLS);

    const mappedConcepts = new Set(Object.values(VALIDATION_CONCEPT_BY_CODE));
    const unmappedSymbols = officialSymbols
      .filter((symbol) => !mappedConcepts.has(symbol));

    assert.deepEqual(unmappedSymbols, []);
  }
);
