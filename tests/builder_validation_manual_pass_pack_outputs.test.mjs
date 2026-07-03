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

test("manual WH app wargear checklist tracks executable parity cases", async () => {
  const wargearParitySource = await readFile(
    join(projectRoot, "tests/builder_validation_wargear_parity_cases.test.mjs"),
    "utf8",
  );
  const checklist = await readFile(join(projectRoot, "docs/wh40k_app_manual_parity_checklist.md"), "utf8");
  const caseIds = [...wargearParitySource.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);

  assert.equal(caseIds.length, 25);
  for (const caseId of caseIds) {
    assert.ok(checklist.includes(`\`${caseId}\``), `manual WH app checklist missing ${caseId}`);
  }
});

test("manual WH app checklist tracks every minimum parity group", async () => {
  const checklist = await readFile(join(projectRoot, "docs/wh40k_app_manual_parity_checklist.md"), "utf8");
  assert.ok(checklist.includes("## Minimum manifest parity groups"));

  for (const parityCase of minimumParityCases) {
    assert.ok(checklist.includes(`\`${parityCase.id}\``), `manual WH app checklist missing ${parityCase.id}`);
  }

  const exportTool = join(projectRoot, "HereticBuilder", "tools", "export_minimum_parity_manifest.mjs");
  const passPackTool = join(projectRoot, "HereticBuilder", "tools", "export_manual_wh40k_pass_pack.mjs");
  const wargearExportTool = join(projectRoot, "HereticBuilder", "tools", "export_wargear_parity_manifest.mjs");
  const jsonManifest = JSON.parse(execNodeWithoutParentCoverage([exportTool, "--json"]));
  assert.equal(jsonManifest.caseCount, 91);
  assert.equal(jsonManifest.cases[0].id, "builder-rule-table-export-counts");

  const markdown = execNodeWithoutParentCoverage([exportTool, "--format", "markdown"]);
  assert.ok(markdown.startsWith("# WH 40K app minimum parity manifest"));
  assert.ok(markdown.includes("| Case id | Test file | Codes | Concepts | WH app method | WH app result | Parity |"));
  assert.ok(markdown.includes("| `live-allied-rule-table-inventory` | tests/builder_validation_allied.test.mjs | none | none | Pending | Pending | Pending |"));

  const manualSummary = JSON.parse(execNodeWithoutParentCoverage([
    exportTool,
    "--check-results",
    join(projectRoot, "docs/wh40k_app_manual_parity_checklist.md"),
    "--allow-manual-pending-only",
  ]));
  assert.equal(manualSummary.status, "pending");
  assert.equal(manualSummary.expectedRows, 91);
  assert.equal(manualSummary.parsedRows, 91);
  assert.equal(manualSummary.missingRows.length, 0);
  assert.equal(manualSummary.pendingRows.length, 17);
  assert.equal(manualSummary.disallowedPendingRows.length, 0);

  const resultsDir = mkdtempSync(join(tmpdir(), "heretic-builder-minimum-results-"));
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
    assert.equal(pendingSummary.pendingRows.length, 91);
    assert.equal(pendingSummary.disallowedPendingRows.length, 0);

    assert.throws(
      () => execNodeWithoutParentCoverage([
        exportTool,
        "--check-results",
        pendingResultsPath,
        "--allow-manual-pending-only",
      ]),
      (error) => {
        const strictPendingSummary = JSON.parse(error.stdout);
        assert.equal(strictPendingSummary.status, "mismatch");
        assert.equal(strictPendingSummary.pendingRows.length, 91);
        assert.equal(strictPendingSummary.disallowedPendingRows.length, 74);
        return true;
      }
    );

    const filledMarkdown = markdown.split("\n").map((line) => {
      if (!line.startsWith("| `")) {
        return line;
      }
      return line.replace(
        " | Pending | Pending | Pending |",
        " | official app manual pass | agrees with Builder | match |",
      );
    }).join("\n");
    const filledResultsPath = join(resultsDir, "filled.md");
    writeFileSync(filledResultsPath, filledMarkdown);
    const matchSummary = JSON.parse(execNodeWithoutParentCoverage([
      exportTool,
      "--check-results",
      filledResultsPath,
    ]));
    assert.equal(matchSummary.status, "match");
    assert.equal(matchSummary.pendingRows.length, 0);

    const mismatchResultsPath = join(resultsDir, "mismatch.md");
    writeFileSync(
      mismatchResultsPath,
      filledMarkdown.replace(" | official app manual pass | agrees with Builder | match |", " | official app manual pass | agrees with Builder | typo |")
    );
    assert.throws(
      () => execNodeWithoutParentCoverage([exportTool, "--check-results", mismatchResultsPath]),
      (error) => {
        const mismatchSummary = JSON.parse(error.stdout);
        assert.equal(mismatchSummary.status, "mismatch");
        assert.equal(mismatchSummary.invalidParityRows.length, 1);
        return true;
      }
    );

    const passPackJson = JSON.parse(execNodeWithoutParentCoverage([passPackTool, "--json"]));
    assert.equal(passPackJson.minimumManualCaseCount, 17);
    assert.equal(passPackJson.minimumManualSubcheckCount, 54);
    assert.equal(passPackJson.wargearCaseCount, 25);
    assert.equal(passPackJson.wargearSetupCount, 26);
    assert.equal(passPackJson.minimumRows[0].id, "heretic-astartes-daemon-allies-points");
    assert.equal(passPackJson.minimumRows[0].setupHints.length, 2);
    assert.equal(passPackJson.minimumRows[0].subchecks.length, 2);
    assert.ok(passPackJson.minimumRows[0].setupHints[0].includes("Heretic Astartes / Strike Force"));
    assert.ok(passPackJson.minimumRows[1].subchecks.some((subcheck) => subcheck.includes("Tzeentch Changecaster")));
    assert.equal(passPackJson.wargearRows.at(-1).caseId, "invalid-unit-loadout");
    const generatedPassPack = execNodeWithoutParentCoverage([passPackTool, "--format", "markdown"]).trim();
    const passPackPath = join(projectRoot, "docs", "wh40k_app_manual_pass_pack.md");
    const checkedInPassPack = await readFile(passPackPath, "utf8");
    assert.equal(checkedInPassPack.trim(), generatedPassPack);
    assert.ok(generatedPassPack.includes("Minimum manual subchecks: 54"));
    assert.ok(generatedPassPack.includes("Subchecks"));
    assert.ok(generatedPassPack.includes("Legiones Daemonica Bloodletters under Strike Force ally points cap stays valid."));
    const generatedRunbook = execNodeWithoutParentCoverage([passPackTool, "--format", "runbook"]).trim();
    const checkedInRunbook = await readFile(join(projectRoot, "docs", "wh40k_app_manual_runbook.md"), "utf8");
    assert.equal(checkedInRunbook.trim(), generatedRunbook);
    assert.equal(execNodeWithoutParentCoverage([passPackTool, "--runbook"]).trim(), generatedRunbook);
    assert.ok(generatedRunbook.startsWith("# WH 40K app manual runbook"));
    assert.ok(generatedRunbook.includes("Total manual rows: 43"));
    assert.ok(generatedRunbook.includes("Minimum UI subchecks: 54"));
    assert.ok(generatedRunbook.includes("one `Setup hint` per atomic official-app check"));
    assert.ok(generatedRunbook.includes("| Heretic Astartes allies | 1, 2, 3, 4, 5 |"));
    assert.ok(generatedRunbook.includes("| Leagues of Votann / Armoured Trailblazers | 1, 3, 4, 5, 10 |"));
    assert.ok(generatedRunbook.includes("| T’au Empire / Advanced Acquisition Cadre | 20, 26 |"));
    const generatedStatus = execNodeWithoutParentCoverage([
      passPackTool,
      "--status",
      "--from",
      passPackPath,
      "--format",
      "markdown",
    ]).trim();
    const checkedInStatus = await readFile(join(projectRoot, "docs", "wh40k_app_manual_status.md"), "utf8");
    assert.equal(checkedInStatus.trim(), generatedStatus);
    assert.ok(generatedStatus.startsWith("# WH 40K app manual pass pack status"));
    assert.ok(generatedStatus.includes("Total rows: 43"));
    assert.ok(generatedStatus.includes("Pending: 43"));
    assert.ok(generatedStatus.includes("Action pending: 43"));
    assert.ok(generatedStatus.includes("Next pending batch: Minimum UI / Heretic Astartes allies (rows 1, 2, 3, 4, 5)"));
    const generatedNextAction = execNodeWithoutParentCoverage([
      passPackTool,
      "--next-action",
      "--from",
      passPackPath,
      "--format",
      "markdown",
    ]).trim();
    const checkedInNextAction = await readFile(join(projectRoot, "docs", "wh40k_app_manual_next_action.md"), "utf8");
    assert.equal(checkedInNextAction.trim(), generatedNextAction);
    assert.ok(generatedNextAction.startsWith("# WH 40K app manual next action"));
    assert.ok(generatedNextAction.includes("State: fill-next-batch"));
    assert.ok(generatedNextAction.includes("Pending rows: 43"));
    assert.ok(generatedNextAction.includes("Next batch: Minimum UI / Heretic Astartes allies (rows 1, 2, 3, 4, 5)"));
    assert.ok(generatedNextAction.includes("Recommended worksheet: docs/wh40k_app_manual_minimum_subcheck_batch.md"));
    assert.ok(generatedNextAction.includes("--extract next-pending-batch"));
    assert.ok(generatedNextAction.includes("--extract minimum-subcheck-batch"));
    assert.ok(generatedNextAction.includes("--check-subcheck-batch"));
    assert.ok(generatedNextAction.includes("--merge-subcheck-batch"));
    const nextActionJson = JSON.parse(execNodeWithoutParentCoverage([
      passPackTool,
      "--next-action",
      "--from",
      passPackPath,
    ]));
    assert.equal(nextActionJson.state, "fill-next-batch");
    assert.equal(nextActionJson.pendingRows, 43);
    assert.equal(nextActionJson.nextBatch.name, "Heretic Astartes allies");
    const generatedNextBatch = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "next-pending-batch",
      "--from",
      passPackPath,
    ]).trim();
    const checkedInNextBatch = await readFile(join(projectRoot, "docs", "wh40k_app_manual_next_batch.md"), "utf8");
    assert.equal(checkedInNextBatch.trim(), generatedNextBatch);
    assert.ok(generatedNextBatch.startsWith("# WH 40K app next pending batch"));
    assert.ok(generatedNextBatch.includes("Section: Minimum UI"));
    assert.ok(generatedNextBatch.includes("Batch: Heretic Astartes allies"));
    assert.ok(generatedNextBatch.includes("Pass-pack rows: 1, 2, 3, 4, 5"));
    assert.ok(generatedNextBatch.includes("| 1 | `heretic-astartes-daemon-allies-points` |"));
    assert.ok(generatedNextBatch.includes("Khorne Bloodmaster without matching Bloodletters emits"));
    assert.ok(generatedNextBatch.includes("Tzeentch Changecaster with matching Pink Horrors does not emit"));
    const generatedSubcheckBatch = execNodeWithoutParentCoverage([
      passPackTool,
      "--extract",
      "minimum-subcheck-batch",
      "--from",
      passPackPath,
    ]).trim();
    const checkedInSubcheckBatch = await readFile(join(projectRoot, "docs", "wh40k_app_manual_minimum_subcheck_batch.md"), "utf8");
    assert.equal(checkedInSubcheckBatch.trim(), generatedSubcheckBatch);
    assert.ok(generatedSubcheckBatch.startsWith("# WH 40K app minimum subcheck batch"));
    assert.ok(generatedSubcheckBatch.includes("Batch: Heretic Astartes allies"));
    assert.ok(generatedSubcheckBatch.includes("Batch subchecks: 24"));
    assert.ok(generatedSubcheckBatch.includes("Setup hint"));
    assert.ok(generatedSubcheckBatch.includes("Roster: Heretic Astartes / Strike Force"));
    assert.ok(generatedSubcheckBatch.includes("| 4 | 8 | `heretic-astartes-cult-legion-detachment` |"));
  } finally {
    rmSync(resultsDir, { recursive: true, force: true });
  }
});
