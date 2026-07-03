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

test("manual WH app pass-pack completion and mismatch outputs stay stable", async () => {
  const exportTool = join(projectRoot, "HereticBuilder", "tools", "export_minimum_parity_manifest.mjs");
  const passPackTool = join(projectRoot, "HereticBuilder", "tools", "export_manual_wh40k_pass_pack.mjs");
  const wargearExportTool = join(projectRoot, "HereticBuilder", "tools", "export_wargear_parity_manifest.mjs");
  const generatedPassPack = execNodeWithoutParentCoverage([passPackTool, "--format", "markdown"]).trim();
  const resultsDir = mkdtempSync(join(tmpdir(), "heretic-builder-manual-completion-"));
  try {
    let inWargearSection = false;
    const filledPassPack = generatedPassPack.split("\n").map((line) => {
      if (line.startsWith("## Wargear UI Cases")) {
        inWargearSection = true;
        return line;
      }
      if (line.startsWith("## Completion Rule")) {
        inWargearSection = false;
        return line;
      }
      if (!line.startsWith("| ")) {
        return line;
      }
      if (inWargearSection && line.includes(" | Pending | Pending | Pending | Pending | Pending |")) {
        const expectedState = line.includes(" | invalid | ") ? "invalid" : "valid";
        return line.replace(
          " | Pending | Pending | Pending | Pending | Pending |",
          ` | ${expectedState} | manual app diagnostic | match | none | WH app result matches Builder fixture |`,
        );
      }
      if (!inWargearSection && line.includes(" | Pending | Pending |")) {
        return line.replace(
          " | Pending | Pending | Pending | Pending |",
          " | official app agrees | match | none | WH app result matches Builder fixture |",
        );
      }
      return line;
    }).join("\n");
    const filledPassPackPath = join(resultsDir, "filled-pass-pack.md");
    writeFileSync(filledPassPackPath, filledPassPack);
    const filledPassPackSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-results",
      filledPassPackPath,
    ]));
    assert.equal(filledPassPackSummary.status, "match");
    assert.equal(filledPassPackSummary.minimum.pendingRows.length, 0);
    assert.equal(filledPassPackSummary.wargear.pendingRows.length, 0);
    const missingEvidencePassPackPath = join(resultsDir, "missing-evidence-pass-pack.md");
    writeFileSync(
      missingEvidencePassPackPath,
      filledPassPack.replace(
        " | valid | manual app diagnostic | match | none | WH app result matches Builder fixture |",
        " | valid | manual app diagnostic | match | none | Pending |",
      ),
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([passPackTool, "--check-results", missingEvidencePassPackPath]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.wargear.evidenceMismatches.length, 1);
        return true;
      }
    );
    const blockedPassPackPath = join(resultsDir, "blocked-pass-pack.md");
    writeFileSync(
      blockedPassPackPath,
      filledPassPack.replace(
        " | valid | manual app diagnostic | match | none | WH app result matches Builder fixture |",
        " | blocked | official app cannot create this setup | blocked | official-ui-blocked | Official UI prevents constructing the selected setup |",
      ),
    );
    const blockedPassPackSummary = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--check-results",
      blockedPassPackPath,
    ]));
    assert.equal(blockedPassPackSummary.status, "match");
    assert.equal(blockedPassPackSummary.wargear.evidenceMismatches.length, 0);
    const blockedStatus = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--status",
      "--from",
      blockedPassPackPath,
    ]));
    assert.equal(blockedStatus.totals.blocked, 1);
    assert.equal(blockedStatus.actionTotals["official-ui-blocked"], 1);
    const blockedBacklog = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "action-backlog",
      "--from",
      blockedPassPackPath,
    ]);
    assert.ok(blockedBacklog.includes("| official-ui-blocked | Wargear UI | 1 | `duplicate-name-cthonian-beserks-default-valid` | blocked |"));
    const filledStatus = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--status",
      "--from",
      filledPassPackPath,
    ]));
    assert.equal(filledStatus.totalRows, 43);
    assert.equal(filledStatus.totals.match, 43);
    assert.equal(filledStatus.totals.pending, 0);
    assert.equal(filledStatus.actionTotals.none, 43);
    assert.equal(filledStatus.actionTotals.pending, 0);
    assert.equal(filledStatus.nextPendingBatch, null);
    const filledNextAction = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--next-action",
      "--from",
      filledPassPackPath,
    ]));
    assert.equal(filledNextAction.state, "complete");
    assert.equal(filledNextAction.pendingRows, 0);
    assert.equal(filledNextAction.nextBatch, null);
    const filledNextBatch = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "next-pending-batch",
      "--from",
      filledPassPackPath,
    ]);
    assert.ok(filledNextBatch.includes("Total pending rows: 0"));
    assert.ok(filledNextBatch.includes("No pending batch."));
    const filledActionBacklog = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "action-backlog",
      "--from",
      filledPassPackPath,
    ]);
    assert.ok(filledActionBacklog.includes("Pending rows: 0"));
    assert.ok(filledActionBacklog.includes("No actionable follow-ups yet."));

    const extractedMinimumChecklist = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "minimum-checklist",
      "--from",
      filledPassPackPath,
    ]);
    const extractedMinimumChecklistPath = join(resultsDir, "extracted-minimum-checklist.md");
    writeFileSync(extractedMinimumChecklistPath, extractedMinimumChecklist);
    const extractedMinimumSummary = JSON.parse(execNodeWithoutParentCoverage([
      exportTool,
      "--check-results",
      extractedMinimumChecklistPath,
    ]));
    assert.equal(extractedMinimumSummary.status, "match");
    assert.equal(extractedMinimumSummary.pendingRows.length, 0);
    assert.ok(extractedMinimumChecklist.includes("| `heretic-astartes-daemon-allies-points` | Manual WH app UI:"));
    assert.ok(extractedMinimumChecklist.includes(" | official app agrees | match |"));

    const extractedWargearResults = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "wargear-results",
      "--from",
      filledPassPackPath,
    ]);
    const extractedWargearResultsPath = join(resultsDir, "extracted-wargear-results.md");
    writeFileSync(extractedWargearResultsPath, extractedWargearResults);
    const extractedWargearSummary = JSON.parse(execNodeWithoutParentCoverage([
      wargearExportTool,
      "--check-results",
      extractedWargearResultsPath,
    ]));
    assert.equal(extractedWargearSummary.status, "match");
    assert.equal(extractedWargearSummary.parsedRows, 26);
    assert.equal(extractedWargearSummary.pendingRows.length, 0);
    assert.ok(extractedWargearResults.startsWith("# WH 40K app wargear parity results"));

    const passPackMismatchPath = join(resultsDir, "mismatch-pass-pack.md");
    writeFileSync(
      passPackMismatchPath,
      filledPassPack.replace(
        " | valid | manual app diagnostic | match | none |",
        " | invalid | manual app diagnostic | mismatch | logic |",
      ),
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([passPackTool, "--check-results", passPackMismatchPath]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.wargear.stateMismatches.length, 1);
        return true;
      }
    );
    const mismatchActionBacklog = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "action-backlog",
      "--from",
      passPackMismatchPath,
    ]);
    assert.ok(mismatchActionBacklog.includes("Logic actions: 1"));
    assert.ok(mismatchActionBacklog.includes("| logic | Wargear UI | 1 | `duplicate-name-cthonian-beserks-default-valid` | mismatch |"));
    const mismatchNextAction = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--next-action",
      "--from",
      passPackMismatchPath,
    ]));
    assert.equal(mismatchNextAction.state, "work-action-backlog");
    assert.equal(mismatchNextAction.actionTotals.logic, 1);
    assert.equal(mismatchNextAction.pendingRows, 0);
    const passPackActionMismatchPath = join(resultsDir, "action-mismatch-pass-pack.md");
    writeFileSync(
      passPackActionMismatchPath,
      filledPassPack.replace(
        " | valid | manual app diagnostic | match | none |",
        " | invalid | manual app diagnostic | mismatch | none |",
      ),
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([passPackTool, "--check-results", passPackActionMismatchPath]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.wargear.actionMismatches.length, 1);
        assert.deepEqual(mismatchSummary.wargear.actionMismatches[0].expectedActions, ["logic", "builder-ui"]);
        return true;
      }
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "next-pending-batch",
        "--from",
        passPackActionMismatchPath,
      ]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.wargear.actionMismatches.length, 1);
        return true;
      }
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "action-backlog",
        "--from",
        passPackActionMismatchPath,
      ]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.wargear.actionMismatches.length, 1);
        return true;
      }
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "wargear-results",
        "--from",
        passPackMismatchPath,
      ]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.wargear.stateMismatches.length, 1);
        return true;
      }
    );
  } finally {
    rmSync(resultsDir, { recursive: true, force: true });
  }
});
