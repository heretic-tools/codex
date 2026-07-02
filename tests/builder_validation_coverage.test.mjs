import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  OFFICIAL_VALIDATION_KEY_TO_CODE,
  validationConceptForCode,
} from "./builder_validation_concepts.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const OFFICIAL_DATASOURCE_STRINGS_PATH =
  "/Applications/WH 40K.app/Wrapper/w40.app/Datasource_BattleForgeDatasource.bundle/en.lproj/Localizable.strings";
const OFFICIAL_UI_STRINGS_PATH =
  "/Applications/WH 40K.app/Wrapper/w40.app/UI_BattleForgeUI.bundle/en.lproj/Localizable.strings";

const OFFICIAL_DATASOURCE_VALIDATION_KEY_PATTERN =
  /^(allegiance_ability|allied_|attach_|attached_|conditional_keyword|detachment_|enhancement|invalid_warlord|keyword_restriction|mandatory_warlord|max_model|roster_|successor|unit_composition|wargear_loadout|warlord_validator)/;

function plistKeys(path) {
  const output = execFileSync("plutil", ["-convert", "json", "-o", "-", path], { encoding: "utf8" });
  return Object.keys(JSON.parse(output));
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
