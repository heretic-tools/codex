import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validationConceptForCode } from "./builder_validation_concepts.mjs";
import {
  actionBacklogBlockingFailures,
  createManualWh40kPassPackBatchWorkflow,
} from "../HereticBuilder/tools/manual_wh40k_pass_pack_batches.mjs";
import {
  builderExpectation,
  conceptList,
  conceptsForCodes,
  manualMinimumSubcheckSetupHints,
  manualMinimumSubchecks,
  setupHintsForMinimumCase,
  subcheckList,
  subchecksForMinimumCase,
} from "../HereticBuilder/tools/manual_wh40k_pass_pack_expectations.mjs";
import { createMinimumSubcheckBatchWorkflow } from "../HereticBuilder/tools/manual_wh40k_pass_pack_subchecks.mjs";
import { minimumParityCases, minimumParityConceptByCode, manualMinimumParityCaseIds } from "./builder_validation_minimum_parity_cases.mjs";
import {
  execNodeWithoutParentCoverage,
  testActionCounts,
  testActionMismatch,
  testCleanMarkdownCell,
  testEvidenceNoteMismatch,
  testIsPendingValue,
  testMarkdownCell,
  testNormalizeAction,
  testSplitMarkdownRow,
  testStatusCounts,
} from "./builder_validation_minimum_parity_helpers.mjs";

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = dirname(dirname(currentFile));
const shouldRegisterTests = process.argv.some((arg) => resolve(arg) === currentFile);

if (shouldRegisterTests) {
  test("minimum WH app parity suite is mapped to focused Builder tests", async () => {
    assert.equal(minimumParityCases.length, 91);
    const caseIds = new Set(minimumParityCases.map((parityCase) => parityCase.id));
    assert.equal(manualMinimumParityCaseIds.length, 17);
    for (const manualCaseId of manualMinimumParityCaseIds) {
      assert.ok(caseIds.has(manualCaseId), `manual pending allowlist has unknown case ${manualCaseId}`);
    }
    assert.deepEqual(
      Object.keys(manualMinimumSubchecks).sort(),
      [...manualMinimumParityCaseIds].sort(),
      "manual minimum subchecks must cover exactly the manual pending allowlist",
    );
    assert.deepEqual(
      Object.keys(manualMinimumSubcheckSetupHints).sort(),
      [...manualMinimumParityCaseIds].sort(),
      "manual minimum setup hints must cover exactly the manual pending allowlist",
    );
    assert.equal(
      Object.values(manualMinimumSubchecks).reduce((total, subchecks) => total + subchecks.length, 0),
      54,
    );
    for (const [caseId, subchecks] of Object.entries(manualMinimumSubchecks)) {
      const setupHints = setupHintsForMinimumCase(caseId);
      assert.equal(setupHints.length, subchecks.length, `${caseId} setup hint count must match subchecks`);
      assert.ok(subchecks.length > 0, `${caseId} must have at least one manual subcheck`);
      assert.equal(new Set(subchecks).size, subchecks.length, `${caseId} has duplicate manual subchecks`);
      for (const subcheck of subchecks) {
        assert.ok(subcheck.trim(), `${caseId} has an empty manual subcheck`);
      }
      for (const setupHint of setupHints) {
        assert.ok(setupHint.trim(), `${caseId} has an empty manual setup hint`);
        assert.notEqual(setupHint.trim().toLowerCase(), "pending", `${caseId} has a pending setup hint`);
      }
    }
    assert.deepEqual(
      subchecksForMinimumCase("heretic-astartes-daemon-allies-points"),
      manualMinimumSubchecks["heretic-astartes-daemon-allies-points"],
    );
    assert.deepEqual(
      setupHintsForMinimumCase("heretic-astartes-daemon-allies-points"),
      manualMinimumSubcheckSetupHints["heretic-astartes-daemon-allies-points"],
    );
    assert.deepEqual(subchecksForMinimumCase("unknown-manual-case"), []);
    assert.deepEqual(setupHintsForMinimumCase("unknown-manual-case"), []);
    assert.equal(
      subcheckList(["first subcheck", "second subcheck"]),
      "first subcheck\nsecond subcheck",
    );
    assert.equal(subcheckList([]), "none");
    assert.deepEqual(
      conceptsForCodes(["allied_points.limit_exceeded"], minimumParityConceptByCode),
      ["AlliedPointsValidator"],
    );
    assert.equal(
      conceptList(["wargear_loadout.invalid_unit_wargear_loadout"], minimumParityConceptByCode),
      "InvalidWargearLoadout",
    );
    assert.equal(builderExpectation([], ""), "valid / no diagnostics");
    assert.equal(builderExpectation([], "valid"), "valid");
    assert.equal(
      builderExpectation(["allied_points.limit_exceeded"], ""),
      "valid controls + invalid diagnostics: allied_points.limit_exceeded",
    );
    assert.equal(
      builderExpectation(["allied_points.limit_exceeded"], "invalid"),
      "invalid: allied_points.limit_exceeded",
    );
    for (const parityCase of minimumParityCases) {
      const source = await readFile(join(projectRoot, parityCase.file), "utf8");
      for (const anchor of parityCase.anchors) {
        assert.ok(source.includes(anchor), `${parityCase.id} missing anchor ${anchor}`);
      }
      for (const code of parityCase.codes) {
        assert.ok(source.includes(code), `${parityCase.id} missing validation code ${code}`);
        assert.ok(minimumParityConceptByCode[code], `${parityCase.id} missing expected concept for ${code}`);
        assert.equal(
          validationConceptForCode(code),
          minimumParityConceptByCode[code],
          `${parityCase.id} concept mismatch for ${code}`,
        );
      }
    }
  });
}

export { minimumParityCases, minimumParityConceptByCode, manualMinimumParityCaseIds };
