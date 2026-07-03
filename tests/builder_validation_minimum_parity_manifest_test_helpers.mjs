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

export {
  assert,
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFile,
  tmpdir,
  dirname,
  join,
  resolve,
  fileURLToPath,
  test,
  validationConceptForCode,
  actionBacklogBlockingFailures,
  createManualWh40kPassPackBatchWorkflow,
  builderExpectation,
  conceptList,
  conceptsForCodes,
  manualMinimumSubcheckSetupHints,
  manualMinimumSubchecks,
  setupHintsForMinimumCase,
  subcheckList,
  subchecksForMinimumCase,
  createMinimumSubcheckBatchWorkflow,
  minimumParityCases,
  minimumParityConceptByCode,
  manualMinimumParityCaseIds,
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
  projectRoot,
};
