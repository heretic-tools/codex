import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validationConceptForCode } from "./builder_validation_concepts.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

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
