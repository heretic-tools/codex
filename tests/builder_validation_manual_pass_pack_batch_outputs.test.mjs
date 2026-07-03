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

test("manual WH app pass-pack batch checks and merges derived rows", async () => {
  const passPackTool = join(projectRoot, "HereticBuilder", "tools", "export_manual_wh40k_pass_pack.mjs");
  const passPackPath = join(projectRoot, "docs", "wh40k_app_manual_pass_pack.md");
  const generatedPassPack = execNodeWithoutParentCoverage([passPackTool, "--format", "markdown"]).trim();
  const generatedNextBatch = execNodeWithoutParentCoverage([
    passPackTool,
    "--extract",
    "next-pending-batch",
    "--from",
    passPackPath,
  ]).trim();
  const generatedSubcheckBatch = execNodeWithoutParentCoverage([
    passPackTool,
    "--extract",
    "minimum-subcheck-batch",
    "--from",
    passPackPath,
  ]).trim();
  const resultsDir = mkdtempSync(join(tmpdir(), "heretic-builder-manual-batches-"));
  try {
    const pendingSubcheckSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-subcheck-batch",
      join(projectRoot, "docs", "wh40k_app_manual_minimum_subcheck_batch.md"),
      "--from",
      passPackPath,
      "--allow-pending",
    ]));
    assert.equal(pendingSubcheckSummary.status, "pending");
    assert.equal(pendingSubcheckSummary.expectedRows, 24);
    assert.equal(pendingSubcheckSummary.parsedRows, 24);
    assert.equal(pendingSubcheckSummary.counts.pending, 24);
    assert.equal(pendingSubcheckSummary.actionTotals.pending, 24);
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--check-subcheck-batch",
        join(projectRoot, "docs", "wh40k_app_manual_minimum_subcheck_batch.md"),
        "--from",
        passPackPath,
      ]),
      (error) => {
        const pendingSummary = JSON.parse(error.stdout);
        assert.equal(pendingSummary.status, "pending");
        return true;
      }
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--merge-subcheck-batch",
        join(projectRoot, "docs", "wh40k_app_manual_minimum_subcheck_batch.md"),
        "--from",
        passPackPath,
      ]),
      (error) => {
        const pendingSummary = JSON.parse(error.stdout);
        assert.match(pendingSummary.error, /not ready: pending/);
        return true;
      }
    );
    const pendingBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-batch",
      passPackPath.replace("wh40k_app_manual_pass_pack.md", "wh40k_app_manual_next_batch.md"),
      "--from",
      passPackPath,
      "--allow-pending",
    ]));
    assert.equal(pendingBatchSummary.status, "pending");
    assert.equal(pendingBatchSummary.section, "Minimum UI");
    assert.equal(pendingBatchSummary.batch, "Heretic Astartes allies");
    assert.equal(pendingBatchSummary.parsedRows, 5);
    assert.equal(pendingBatchSummary.counts.pending, 5);
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--check-batch",
        passPackPath.replace("wh40k_app_manual_pass_pack.md", "wh40k_app_manual_next_batch.md"),
        "--from",
        passPackPath,
      ]),
      (error) => {
        const pendingSummary = JSON.parse(error.stdout);
        assert.equal(pendingSummary.status, "pending");
        return true;
      }
    );
    const filledMinimumNextBatchPath = join(resultsDir, "filled-minimum-next-batch.md");
    const filledMinimumNextBatch = generatedNextBatch.split("\n").map((line) => {
      if (!line.startsWith("| ") || line.startsWith("| Row") || line.startsWith("| ---")) {
        return line;
      }
      return line.replace(
        " | Pending | Pending | Pending | Pending |",
        " | official app agrees | match | none | WH app result matches Builder fixture |",
      );
    }).join("\n");
    writeFileSync(filledMinimumNextBatchPath, filledMinimumNextBatch);
    const filledSubcheckBatchPath = join(resultsDir, "filled-minimum-subcheck-batch.md");
    const filledSubcheckBatch = generatedSubcheckBatch.split("\n").map((line) => {
      if (!line.startsWith("| ") || line.startsWith("| Pass-pack row") || line.startsWith("| ---")) {
        return line;
      }
      return line.replace(
        " | Pending | Pending | Pending | Pending |",
        " | official app agrees | match | none | WH app subcheck matches Builder fixture |",
      );
    }).join("\n");
    writeFileSync(filledSubcheckBatchPath, filledSubcheckBatch);
    const filledSubcheckSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-subcheck-batch",
      filledSubcheckBatchPath,
      "--from",
      passPackPath,
    ]));
    assert.equal(filledSubcheckSummary.status, "ready");
    assert.equal(filledSubcheckSummary.counts.match, 24);
    assert.equal(filledSubcheckSummary.actionTotals.none, 24);
    const mergedSubcheckPassPack = execNodeWithoutParentCoverage([
      passPackTool,
      "--merge-subcheck-batch",
      filledSubcheckBatchPath,
      "--from",
      passPackPath,
    ]);
    const mergedSubcheckPassPackPath = join(resultsDir, "merged-subcheck-pass-pack.md");
    writeFileSync(mergedSubcheckPassPackPath, mergedSubcheckPassPack);
    assert.ok(mergedSubcheckPassPack.includes(" | 2 subchecks, 2 match, 0 mismatch, 0 blocked | match | none | Derived from filled minimum subcheck batch: 2 subchecks, 2 match, 0 mismatch, 0 blocked. |"));
    const mergedSubcheckSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-results",
      mergedSubcheckPassPackPath,
      "--allow-pending",
    ]));
    assert.equal(mergedSubcheckSummary.status, "pending");
    assert.equal(mergedSubcheckSummary.minimum.pendingRows.length, 12);
    assert.equal(mergedSubcheckSummary.wargear.pendingRows.length, 26);
    const mergedSubcheckNext = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "next-pending-batch",
      "--from",
      mergedSubcheckPassPackPath,
    ]);
    assert.ok(mergedSubcheckNext.includes("Batch: Adeptus Astartes faction rules"));
    const badSubcheckActionPath = join(resultsDir, "bad-subcheck-action.md");
    writeFileSync(
      badSubcheckActionPath,
      filledSubcheckBatch.replace(" | match | none |", " | match | logic |"),
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--check-subcheck-batch",
        badSubcheckActionPath,
        "--from",
        passPackPath,
      ]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.actionMismatches.length, 1);
        return true;
      }
    );
    const missingSubcheckEvidencePath = join(resultsDir, "missing-subcheck-evidence.md");
    writeFileSync(
      missingSubcheckEvidencePath,
      filledSubcheckBatch.replace(" | none | WH app subcheck matches Builder fixture |", " | none | Pending |"),
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--check-subcheck-batch",
        missingSubcheckEvidencePath,
        "--from",
        passPackPath,
      ]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.evidenceMismatches.length, 1);
        return true;
      }
    );
    const filledMinimumBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-batch",
      filledMinimumNextBatchPath,
      "--from",
      passPackPath,
    ]));
    assert.equal(filledMinimumBatchSummary.status, "ready");
    assert.equal(filledMinimumBatchSummary.counts.match, 5);
    assert.equal(filledMinimumBatchSummary.actionTotals.none, 5);
    const mergedFirstBatchPassPack = execNodeWithoutParentCoverage([
      passPackTool,
      "--merge-batch",
      filledMinimumNextBatchPath,
      "--from",
      passPackPath,
    ]);
    const mergedFirstBatchPassPackPath = join(resultsDir, "merged-first-batch-pass-pack.md");
    writeFileSync(mergedFirstBatchPassPackPath, mergedFirstBatchPassPack);
    const mergedFirstBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-results",
      mergedFirstBatchPassPackPath,
      "--allow-pending",
    ]));
    assert.equal(mergedFirstBatchSummary.status, "pending");
    assert.equal(mergedFirstBatchSummary.minimum.pendingRows.length, 12);
    assert.equal(mergedFirstBatchSummary.wargear.pendingRows.length, 26);
    const mergedFirstBatchNext = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "next-pending-batch",
      "--from",
      mergedFirstBatchPassPackPath,
    ]);
    assert.ok(mergedFirstBatchNext.includes("Batch: Adeptus Astartes faction rules"));
    const badActionNextBatchPath = join(resultsDir, "bad-action-next-batch.md");
    writeFileSync(
      badActionNextBatchPath,
      filledMinimumNextBatch.replace(" | match | none |", " | match | logic |"),
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--check-batch",
        badActionNextBatchPath,
        "--from",
        passPackPath,
      ]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.structuralSummary.minimumActionMismatches, 1);
        return true;
      }
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--merge-batch",
        badActionNextBatchPath,
        "--from",
        passPackPath,
      ]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.minimum.actionMismatches.length, 1);
        return true;
      }
    );
    const generatedActionBacklog = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "action-backlog",
      "--from",
      passPackPath,
    ]).trim();
    const checkedInActionBacklog = await readFile(join(projectRoot, "docs", "wh40k_app_manual_action_backlog.md"), "utf8");
    assert.equal(checkedInActionBacklog.trim(), generatedActionBacklog);
    assert.ok(generatedActionBacklog.startsWith("# WH 40K app manual action backlog"));
    assert.ok(generatedActionBacklog.includes("Pending rows: 43"));
    assert.ok(generatedActionBacklog.includes("No actionable follow-ups yet."));
    const passPackStatus = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--status",
      "--from",
      passPackPath,
    ]));
    assert.equal(passPackStatus.totalRows, 43);
    assert.equal(passPackStatus.totals.pending, 43);
    assert.equal(passPackStatus.totals.match, 0);
    assert.equal(passPackStatus.actionTotals.pending, 43);
    assert.equal(passPackStatus.actionTotals.none, 0);
    assert.equal(passPackStatus.nextPendingBatch.name, "Heretic Astartes allies");

    assert.throws(
      () => execNodeWithoutParentCoverage(
        [passPackTool, "--check-results", passPackPath],
        { stdio: ["ignore", "ignore", "pipe"] },
      ),
      (error) => {
        assert.equal(error.status, 1);
        return true;
      }
    );

    const passPackSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-results",
      passPackPath,
      "--allow-pending",
    ]));
    assert.equal(passPackSummary.status, "pending");
    assert.equal(passPackSummary.minimum.expectedRows, 17);
    assert.equal(passPackSummary.minimum.parsedRows, 17);
    assert.equal(passPackSummary.minimum.pendingRows.length, 17);
    assert.equal(passPackSummary.minimum.actionMismatches.length, 0);
    assert.equal(passPackSummary.wargear.expectedRows, 26);
    assert.equal(passPackSummary.wargear.parsedRows, 26);
    assert.equal(passPackSummary.wargear.pendingRows.length, 26);
    assert.equal(passPackSummary.wargear.actionMismatches.length, 0);

    let inMinimumOnlyWargearSection = false;
    const minimumOnlyFilledPassPack = generatedPassPack.split("\n").map((line) => {
      if (line.startsWith("## Wargear UI Cases")) {
        inMinimumOnlyWargearSection = true;
        return line;
      }
      if (!inMinimumOnlyWargearSection && line.startsWith("| ") && line.includes(" | Pending | Pending | Pending | Pending |")) {
        return line.replace(
          " | Pending | Pending | Pending | Pending |",
          " | official app agrees | match | none | WH app result matches Builder fixture |",
        );
      }
      return line;
    }).join("\n");
    const minimumOnlyFilledPassPackPath = join(resultsDir, "minimum-only-filled-pass-pack.md");
    writeFileSync(minimumOnlyFilledPassPackPath, minimumOnlyFilledPassPack);
    const noMinimumSubcheckBatch = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "minimum-subcheck-batch",
      "--from",
      minimumOnlyFilledPassPackPath,
    ]);
    assert.ok(noMinimumSubcheckBatch.includes("No pending minimum subcheck batch."));
    const wargearNextBatch = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "next-pending-batch",
      "--from",
      minimumOnlyFilledPassPackPath,
    ]);
    assert.ok(wargearNextBatch.includes("Section: Wargear UI"));
    assert.ok(wargearNextBatch.includes("Batch: Leagues of Votann / Armoured Trailblazers"));
    assert.ok(wargearNextBatch.includes("| 1 | `duplicate-name-cthonian-beserks-default-valid` | valid |"));
    const filledWargearNextBatchPath = join(resultsDir, "filled-wargear-next-batch.md");
    const filledWargearNextBatch = wargearNextBatch.split("\n").map((line) => {
      if (!line.startsWith("| ") || line.startsWith("| Row") || line.startsWith("| ---")) {
        return line;
      }
      const expectedState = line.includes(" | invalid | ") ? "invalid" : "valid";
      return line.replace(
        " | Pending | Pending | Pending | Pending | Pending |",
        ` | ${expectedState} | manual app diagnostic | match | none | WH app result matches Builder fixture |`,
      );
    }).join("\n");
    writeFileSync(filledWargearNextBatchPath, filledWargearNextBatch);
    const filledWargearBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-batch",
      filledWargearNextBatchPath,
      "--from",
      minimumOnlyFilledPassPackPath,
    ]));
    assert.equal(filledWargearBatchSummary.status, "ready");
    assert.equal(filledWargearBatchSummary.parsedRows, 5);
    assert.equal(filledWargearBatchSummary.counts.match, 5);
    const mergedWargearBatchPassPack = execNodeWithoutParentCoverage([
      passPackTool,
      "--merge-batch",
      filledWargearNextBatchPath,
      "--from",
      minimumOnlyFilledPassPackPath,
    ]);
    const mergedWargearBatchPassPackPath = join(resultsDir, "merged-wargear-batch-pass-pack.md");
    writeFileSync(mergedWargearBatchPassPackPath, mergedWargearBatchPassPack);
    const mergedWargearBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-results",
      mergedWargearBatchPassPackPath,
      "--allow-pending",
    ]));
    assert.equal(mergedWargearBatchSummary.status, "pending");
    assert.equal(mergedWargearBatchSummary.minimum.pendingRows.length, 0);
    assert.equal(mergedWargearBatchSummary.wargear.pendingRows.length, 21);
    const mergedWargearBatchNext = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "next-pending-batch",
      "--from",
      mergedWargearBatchPassPackPath,
    ]);
    assert.ok(mergedWargearBatchNext.includes("Batch: Orks / More Dakka!"));
  } finally {
    rmSync(resultsDir, { recursive: true, force: true });
  }
});
