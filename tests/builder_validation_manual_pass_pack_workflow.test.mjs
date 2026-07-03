import {
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
} from "./builder_validation_minimum_parity_manifest_test_helpers.mjs";

test("manual WH app pass-pack helper modules merge checked batches", () => {
  const groupedMinimumRows = (rows) => [{
    name: "Synthetic minimum batch",
    rows: rows.map((row, index) => ({ ...row, rowNumber: index + 1 })),
  }];
  const passPackStatus = () => ({
    dataVersion: 879,
    nextPendingBatch: {
      name: "Synthetic minimum batch",
      pendingRows: [1],
      section: "Minimum UI",
    },
    totals: { blocked: 0, invalid: 0, match: 0, mismatch: 0, pending: 1 },
  });
  const pack = {
    dataVersion: 879,
    minimumManualSubcheckCount: 2,
    minimumRows: [{
      codes: ["allied_points.limit_exceeded"],
      file: "tests/synthetic.test.mjs",
      id: "synthetic-case",
      subchecks: ["Synthetic valid control.", "Synthetic invalid control."],
      whAppMethod: "Manual WH app UI synthetic scenario.",
    }],
  };
  const passPackMarkdown = [
    "## Minimum Manual UI Cases",
    "",
    "| # | Case id | Builder test | Codes | WH app scenario | WH app result | Parity | Action | Evidence note | Builder expectation | Official concepts | Subchecks |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | `synthetic-case` | tests/synthetic.test.mjs | allied_points.limit_exceeded | Manual WH app UI synthetic scenario. | Pending | Pending | Pending | Pending | valid controls + invalid diagnostics: allied_points.limit_exceeded | AlliedPointsValidator | Synthetic valid control.<br>Synthetic invalid control. |",
    "",
    "## Wargear UI Cases",
  ].join("\n");
  const subcheckWorkflow = createMinimumSubcheckBatchWorkflow({
    actionCounts: testActionCounts,
    actionMismatch: testActionMismatch,
    cleanMarkdownCell: testCleanMarkdownCell,
    conceptByCode: minimumParityConceptByCode,
    evidenceNoteMismatch: testEvidenceNoteMismatch,
    groupedMinimumRows,
    isPendingValue: testIsPendingValue,
    markdownCell: testMarkdownCell,
    normalizeAction: testNormalizeAction,
    passPackStatus,
    splitMarkdownRow: testSplitMarkdownRow,
    statusCounts: testStatusCounts,
  });

  const pendingSubchecks = subcheckWorkflow.minimumSubcheckBatchMarkdown(pack, passPackMarkdown);
  assert.ok(pendingSubchecks.includes("Batch subchecks: 2"));
  const pendingSummary = subcheckWorkflow.minimumSubcheckBatchCheckSummary(pack, passPackMarkdown, pendingSubchecks);
  assert.equal(pendingSummary.status, "pending");
  assert.equal(pendingSummary.expectedRows, 2);
  assert.equal(pendingSummary.parsedRows, 2);

  const filledSubchecks = pendingSubchecks.split("\n").map((line) => {
    if (!line.startsWith("| ") || line.startsWith("| Pass-pack row") || line.startsWith("| ---")) {
      return line;
    }
    return line.replace(
      " | Pending | Pending | Pending | Pending |",
      " | official app agrees | match | none | WH app subcheck observed in official app |",
    );
  }).join("\n");
  const filledSummary = subcheckWorkflow.minimumSubcheckBatchCheckSummary(pack, passPackMarkdown, filledSubchecks);
  assert.equal(filledSummary.status, "ready");
  assert.equal(filledSummary.counts.match, 2);
  const merged = subcheckWorkflow.mergeMinimumSubcheckBatchIntoPassPack(pack, passPackMarkdown, filledSubchecks);
  assert.ok(merged.includes("2 subchecks, 2 match, 0 mismatch, 0 blocked"));
  assert.ok(merged.includes("Derived from filled minimum subcheck batch"));

  const mismatchedSubchecks = filledSubchecks.replace(
    " | official app agrees | match | none |",
    " | official app disagrees | mismatch | logic |",
  );
  const mergedMismatch = subcheckWorkflow.mergeMinimumSubcheckBatchIntoPassPack(pack, passPackMarkdown, mismatchedSubchecks);
  assert.ok(mergedMismatch.includes("2 subchecks, 1 match, 1 mismatch, 0 blocked | mismatch | logic |"));
  assert.throws(
    () => subcheckWorkflow.mergeMinimumSubcheckBatchIntoPassPack(pack, passPackMarkdown, pendingSubchecks),
    /not ready: pending/,
  );
});

test("manual WH app next-batch helpers validate and merge current rows", () => {
  const groupedMinimumRows = (rows) => [{
    name: "Synthetic minimum batch",
    rows: rows.map((row, index) => ({ ...row, rowNumber: index + 1 })),
  }];
  const passPackStatus = () => ({
    dataVersion: 879,
    nextPendingBatch: {
      name: "Synthetic minimum batch",
      pendingRows: [1],
      section: "Minimum UI",
    },
    totals: { blocked: 0, invalid: 0, match: 0, mismatch: 0, pending: 1 },
  });
  const pack = {
    dataVersion: 879,
    minimumRows: [{
      codes: ["allied_points.limit_exceeded"],
      file: "tests/synthetic.test.mjs",
      id: "synthetic-case",
      subchecks: ["Synthetic subcheck."],
      whAppMethod: "Manual WH app UI synthetic scenario.",
    }],
    wargearRows: [],
  };
  const passPackMarkdown = [
    "## Minimum Manual UI Cases",
    "",
    "| # | Case id | Builder test | Codes | WH app scenario | WH app result | Parity | Action | Evidence note | Builder expectation | Official concepts | Subchecks |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | `synthetic-case` | tests/synthetic.test.mjs | allied_points.limit_exceeded | Manual WH app UI synthetic scenario. | Pending | Pending | Pending | Pending | valid controls + invalid diagnostics: allied_points.limit_exceeded | AlliedPointsValidator | Synthetic subcheck. |",
    "",
    "## Wargear UI Cases",
  ].join("\n");
  const emptyStructuralSummary = {
    minimum: {
      actionMismatches: [],
      duplicateRows: [],
      evidenceMismatches: [],
      invalidParityRows: [],
      missingRows: [],
      unexpectedRows: [],
    },
    status: "pending",
    wargear: {
      actionMismatches: [],
      duplicateRows: [],
      evidenceMismatches: [],
      missingRows: [],
      parityMismatches: [],
      stateMismatches: [],
      unexpectedRows: [],
    },
  };
  const batchWorkflow = createManualWh40kPassPackBatchWorkflow({
    actionCounts: testActionCounts,
    checkPassPackResults: () => emptyStructuralSummary,
    cleanMarkdownCell: testCleanMarkdownCell,
    conceptByCode: minimumParityConceptByCode,
    emptyActionCounts: () => ({ pending: 0, none: 0, logic: 0, "builder-ui": 0, "official-ui-blocked": 0 }),
    emptyStatusCounts: () => ({ blocked: 0, invalid: 0, match: 0, mismatch: 0, pending: 0 }),
    groupedMinimumRows,
    groupedWargearRows: () => [],
    isPendingValue: testIsPendingValue,
    markdownCell: testMarkdownCell,
    normalizeAction: testNormalizeAction,
    passPackMinimumRows: () => [{
      action: "Pending",
      caseId: "synthetic-case",
      evidenceNote: "Pending",
      parity: "pending",
      whAppResult: "Pending",
    }],
    passPackStatus,
    passPackWargearRows: () => [],
    resultDisplayValue: (value) => testIsPendingValue(value) ? "Pending" : String(value),
    splitMarkdownRow: testSplitMarkdownRow,
    statusCounts: testStatusCounts,
    wargearKey: (row) => [row.caseId, row.rosterFaction, row.detachment, row.unit].join("\u0000"),
  });

  const nextBatch = batchWorkflow.nextPendingBatchMarkdown(pack, passPackMarkdown);
  assert.ok(nextBatch.includes("Batch: Synthetic minimum batch"));
  assert.ok(nextBatch.includes("| 1 | `synthetic-case` |"));
  const pendingBatchSummary = batchWorkflow.nextBatchCheckSummary(pack, passPackMarkdown, nextBatch);
  assert.equal(pendingBatchSummary.status, "pending");
  assert.equal(pendingBatchSummary.parsedRows, 1);

  const filledBatch = nextBatch.replace(
    " | Pending | Pending | Pending | Pending |",
    " | official app agrees | match | none | WH app result matches Builder fixture |",
  );
  const filledBatchSummary = batchWorkflow.nextBatchCheckSummary(pack, passPackMarkdown, filledBatch);
  assert.equal(filledBatchSummary.status, "ready");
  assert.equal(filledBatchSummary.counts.match, 1);
  const merged = batchWorkflow.mergeNextBatchIntoPassPack(passPackMarkdown, filledBatch);
  assert.ok(merged.includes("official app agrees | match | none | WH app result matches Builder fixture"));
  assert.equal(actionBacklogBlockingFailures(emptyStructuralSummary), 0);
  assert.equal(actionBacklogBlockingFailures({
    ...emptyStructuralSummary,
    minimum: {
      ...emptyStructuralSummary.minimum,
      actionMismatches: [{}],
    },
  }), 1);
});
