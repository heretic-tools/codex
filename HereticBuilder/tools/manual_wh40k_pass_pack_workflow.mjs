function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function minimumRunbookGroup(row) {
  if (row.id.startsWith("heretic-astartes-")) {
    return "Heretic Astartes allies";
  }
  if (row.id.startsWith("adeptus-astartes-")) {
    return "Adeptus Astartes faction rules";
  }
  if (row.id.startsWith("ynnari-") || row.id.startsWith("asuryani-") || row.id.startsWith("drukhari-")) {
    return "Aeldari and Drukhari faction rules";
  }
  if (row.id.startsWith("enhancement-")) {
    return "Enhancements";
  }
  if (row.id.startsWith("attachment-")) {
    return "Attachments";
  }
  if (row.id.startsWith("allegiance-")) {
    return "Allegiance abilities";
  }
  return "Other minimum UI checks";
}

function createManualWh40kPassPackWorkflow(deps) {
  const {
    actionValues,
    checkPassPackResults,
    isPendingValue,
    markdownCell,
    normalizeAction,
    passPackMinimumRows,
    passPackWargearRows,
    wargearKey,
  } = deps;

  function groupedMinimumRows(rows) {
    const groups = new Map();
    rows.forEach((row, index) => {
      const groupName = minimumRunbookGroup(row);
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName).push({ ...row, rowNumber: index + 1 });
    });
    return [...groups.entries()].map(([name, groupRows]) => ({ name, rows: groupRows }));
  }

  function groupedWargearRows(rows) {
    const groups = new Map();
    rows.forEach((row, index) => {
      const groupKey = `${row.rosterFaction} / ${row.detachment}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push({ ...row, rowNumber: index + 1 });
    });
    return [...groups.entries()].map(([name, groupRows]) => ({ name, rows: groupRows }));
  }

  function emptyStatusCounts() {
    return {
      blocked: 0,
      invalid: 0,
      match: 0,
      mismatch: 0,
      pending: 0,
    };
  }

  function emptyActionCounts() {
    return Object.fromEntries(actionValues.map((action) => [action, 0]));
  }

  function statusCounts(rows) {
    const counts = emptyStatusCounts();
    for (const row of rows) {
      counts[row.status] = (counts[row.status] || 0) + 1;
    }
    return counts;
  }

  function addCounts(target, source) {
    for (const key of Object.keys(target)) {
      target[key] += source[key] || 0;
    }
    return target;
  }

  function actionCounts(rows) {
    const counts = emptyActionCounts();
    for (const row of rows) {
      const action = normalizeAction(row.action);
      counts[action] = (counts[action] || 0) + 1;
    }
    return counts;
  }

  function minimumActualStatus(actual) {
    if (!actual) {
      return "invalid";
    }
    if ([actual.whAppResult, actual.parity].some(isPendingValue)) {
      return "pending";
    }
    if (["match", "mismatch", "blocked"].includes(actual.parity)) {
      return actual.parity;
    }
    return "invalid";
  }

  function wargearActualStatus(expected, actual) {
    if (!actual) {
      return "invalid";
    }
    if ([actual.whAppState, actual.whAppDiagnostic, actual.parity].some(isPendingValue)) {
      return "pending";
    }
    if (actual.parity === "blocked") {
      return "blocked";
    }
    if (!["valid", "invalid"].includes(actual.whAppState) || !["match", "mismatch"].includes(actual.parity)) {
      return "invalid";
    }
    const expectedParity = actual.whAppState === expected.expectedState ? "match" : "mismatch";
    if (actual.parity !== expectedParity) {
      return "mismatch";
    }
    return actual.parity;
  }

  function batchStatus(counts) {
    if (counts.invalid || counts.mismatch) {
      return "mismatch";
    }
    if (counts.pending) {
      return "pending";
    }
    if (counts.blocked && !counts.match) {
      return "blocked";
    }
    if (counts.blocked) {
      return "partial";
    }
    return "match";
  }

  function statusRow(section, row, status, action) {
    return {
      action: normalizeAction(action),
      caseId: row.id || row.caseId,
      rowNumber: row.rowNumber,
      section,
      status,
      unit: row.unit || "",
    };
  }

  function passPackStatus(pack, markdown) {
    const structuralSummary = checkPassPackResults(pack, markdown, { allowPending: true });
    const minimumById = new Map(passPackMinimumRows(markdown).map((row) => [row.caseId, row]));
    const wargearByKey = new Map(passPackWargearRows(markdown).map((row) => [wargearKey(row), row]));
    const actionTotals = emptyActionCounts();
    const totals = emptyStatusCounts();

    const minimumBatches = groupedMinimumRows(pack.minimumRows).map((batch) => {
      const rows = batch.rows.map((row) => {
        const actual = minimumById.get(row.id);
        return statusRow(
          "Minimum UI",
          row,
          minimumActualStatus(actual),
          actual?.action,
        );
      });
      const counts = statusCounts(rows);
      const actions = actionCounts(rows);
      addCounts(totals, counts);
      addCounts(actionTotals, actions);
      return {
        actions,
        counts,
        name: batch.name,
        rowNumbers: batch.rows.map((row) => row.rowNumber),
        rows,
        status: batchStatus(counts),
      };
    });

    const wargearBatches = groupedWargearRows(pack.wargearRows).map((batch) => {
      const rows = batch.rows.map((row) => {
        const actual = wargearByKey.get(wargearKey(row));
        return statusRow(
          "Wargear UI",
          row,
          wargearActualStatus(row, actual),
          actual?.action,
        );
      });
      const counts = statusCounts(rows);
      const actions = actionCounts(rows);
      addCounts(totals, counts);
      addCounts(actionTotals, actions);
      return {
        actions,
        counts,
        name: batch.name,
        rowNumbers: batch.rows.map((row) => row.rowNumber),
        rows,
        status: batchStatus(counts),
      };
    });

    const allBatches = [
      ...minimumBatches.map((batch) => ({ ...batch, section: "Minimum UI" })),
      ...wargearBatches.map((batch) => ({ ...batch, section: "Wargear UI" })),
    ];
    const nextPendingBatch = allBatches.find((batch) => batch.counts.pending > 0) || null;

    return {
      actionTotals,
      dataVersion: pack.dataVersion,
      minimumBatches,
      nextPendingBatch: nextPendingBatch ? {
        name: nextPendingBatch.name,
        pendingRows: nextPendingBatch.rows
          .filter((row) => row.status === "pending")
          .map((row) => row.rowNumber),
        section: nextPendingBatch.section,
      } : null,
      structuralStatus: structuralSummary.status,
      structuralSummary: {
        minimumActionMismatches: structuralSummary.minimum.actionMismatches.length,
        minimumDuplicateRows: structuralSummary.minimum.duplicateRows.length,
        minimumInvalidParityRows: structuralSummary.minimum.invalidParityRows.length,
        minimumMissingRows: structuralSummary.minimum.missingRows.length,
        minimumUnexpectedRows: structuralSummary.minimum.unexpectedRows.length,
        wargearActionMismatches: structuralSummary.wargear.actionMismatches.length,
        wargearDuplicateRows: structuralSummary.wargear.duplicateRows.length,
        wargearMissingRows: structuralSummary.wargear.missingRows.length,
        wargearParityMismatches: structuralSummary.wargear.parityMismatches.length,
        wargearStateMismatches: structuralSummary.wargear.stateMismatches.length,
        wargearUnexpectedRows: structuralSummary.wargear.unexpectedRows.length,
      },
      totalRows: pack.minimumManualCaseCount + pack.wargearSetupCount,
      totals,
      wargearBatches,
    };
  }

  function markdownStatusOutput(status) {
    const nextBatch = status.nextPendingBatch
      ? `${status.nextPendingBatch.section} / ${status.nextPendingBatch.name} (rows ${status.nextPendingBatch.pendingRows.join(", ")})`
      : "none";
    const lines = [
      "# WH 40K app manual pass pack status",
      "",
      "Date: 2026-07-03",
      "",
      `Data version: ${status.dataVersion}`,
      `Total rows: ${status.totalRows}`,
      `Match: ${status.totals.match}`,
      `Pending: ${status.totals.pending}`,
      `Mismatch: ${status.totals.mismatch}`,
      `Blocked: ${status.totals.blocked}`,
      `Invalid: ${status.totals.invalid}`,
      `Action pending: ${status.actionTotals.pending}`,
      `Action none: ${status.actionTotals.none}`,
      `Action logic: ${status.actionTotals.logic}`,
      `Action builder-ui: ${status.actionTotals["builder-ui"]}`,
      `Action official-ui-blocked: ${status.actionTotals["official-ui-blocked"]}`,
      `Structural status: ${status.structuralStatus}`,
      `Next pending batch: ${nextBatch}`,
      "",
      "## Batches",
      "",
      "| Section | Batch | Rows | Status | Match | Pending | Mismatch | Blocked | Invalid | Action pending | None | Logic | Builder UI | Official UI blocked |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ];

    for (const batch of [
      ...status.minimumBatches.map((item) => ({ ...item, section: "Minimum UI" })),
      ...status.wargearBatches.map((item) => ({ ...item, section: "Wargear UI" })),
    ]) {
      lines.push([
        markdownCell(batch.section),
        markdownCell(batch.name),
        markdownCell(batch.rowNumbers.join(", ")),
        markdownCell(batch.status),
        String(batch.counts.match),
        String(batch.counts.pending),
        String(batch.counts.mismatch),
        String(batch.counts.blocked),
        String(batch.counts.invalid),
        String(batch.actions.pending),
        String(batch.actions.none),
        String(batch.actions.logic),
        String(batch.actions["builder-ui"]),
        String(batch.actions["official-ui-blocked"]),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }

    return lines.join("\n");
  }

  function blockingStructuralCount(structuralSummary) {
    return structuralSummary.minimumActionMismatches +
      structuralSummary.minimumDuplicateRows +
      structuralSummary.minimumInvalidParityRows +
      structuralSummary.minimumMissingRows +
      structuralSummary.minimumUnexpectedRows +
      structuralSummary.wargearActionMismatches +
      structuralSummary.wargearDuplicateRows +
      structuralSummary.wargearMissingRows +
      structuralSummary.wargearParityMismatches +
      structuralSummary.wargearUnexpectedRows;
  }

  function workflowCommands() {
    return {
      checkBatchPending: "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending",
      checkFilledBatch: "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md",
      extractActionBacklog: "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract action-backlog --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_action_backlog.md",
      extractMinimumChecklist: "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract minimum-checklist --from docs/wh40k_app_manual_pass_pack.md > updated-minimum-checklist.md",
      extractNextBatch: "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract next-pending-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_next_batch.md",
      extractWargearResults: "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract wargear-results --from docs/wh40k_app_manual_pass_pack.md > filled-wargear-results.md",
      mergeBatch: "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --merge-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md > updated-pass-pack.md",
      refreshStatus: "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --status --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_status.md",
    };
  }

  function nextActionSummary(status) {
    const blockingFailures = blockingStructuralCount(status.structuralSummary);
    const actionableRows = status.actionTotals.logic +
      status.actionTotals["builder-ui"] +
      status.actionTotals["official-ui-blocked"];
    const commands = workflowCommands();
    let state = "complete";
    let reason = "No pending or actionable manual rows remain.";
    let commandsToRun = [
      commands.extractMinimumChecklist,
      commands.extractWargearResults,
    ];

    if (blockingFailures) {
      state = "repair-pass-pack";
      reason = "Pass pack has malformed or action-inconsistent rows.";
      commandsToRun = [
        commands.refreshStatus,
        commands.extractActionBacklog,
      ];
    } else if (status.totals.pending) {
      state = "fill-next-batch";
      reason = "Official WH 40K app UI results are still needed for the next pending batch.";
      commandsToRun = [
        commands.extractNextBatch,
        commands.checkBatchPending,
        commands.checkFilledBatch,
        commands.mergeBatch,
        commands.refreshStatus,
        commands.extractActionBacklog,
      ];
    } else if (actionableRows) {
      state = "work-action-backlog";
      reason = "Manual pass is complete, but triaged follow-up actions remain.";
      commandsToRun = [
        commands.extractActionBacklog,
      ];
    }

    return {
      actionTotals: status.actionTotals,
      blockingFailures,
      commands,
      commandsToRun,
      dataVersion: status.dataVersion,
      nextBatch: status.nextPendingBatch,
      pendingRows: status.totals.pending,
      reason,
      state,
      totals: status.totals,
    };
  }

  function markdownNextActionOutput(summary) {
    const nextBatch = summary.nextBatch
      ? `${summary.nextBatch.section} / ${summary.nextBatch.name} (rows ${summary.nextBatch.pendingRows.join(", ")})`
      : "none";
    const lines = [
      "# WH 40K app manual next action",
      "",
      "Date: 2026-07-03",
      "",
      `Data version: ${summary.dataVersion}`,
      `State: ${summary.state}`,
      `Reason: ${summary.reason}`,
      `Pending rows: ${summary.pendingRows}`,
      `Blocking failures: ${summary.blockingFailures}`,
      `Next batch: ${nextBatch}`,
      `Action logic: ${summary.actionTotals.logic}`,
      `Action builder-ui: ${summary.actionTotals["builder-ui"]}`,
      `Action official-ui-blocked: ${summary.actionTotals["official-ui-blocked"]}`,
      "",
      "## Commands",
      "",
    ];

    if (!summary.commandsToRun.length) {
      lines.push("No commands required.");
      return lines.join("\n");
    }

    lines.push("```bash", ...summary.commandsToRun, "```");
    return lines.join("\n");
  }

  function runbookOutput(pack) {
    const minimumGroups = groupedMinimumRows(pack.minimumRows);
    const wargearGroups = groupedWargearRows(pack.wargearRows);
    const lines = [
      "# WH 40K app manual runbook",
      "",
      "Date: 2026-07-03",
      "",
      "Scope: execution order for the remaining official WH 40K app UI checks.",
      "",
      `Data version: ${pack.dataVersion}`,
      `Total manual rows: ${pack.minimumManualCaseCount + pack.wargearSetupCount}`,
      `Minimum UI/golden rows: ${pack.minimumManualCaseCount}`,
      `Wargear UI setup rows: ${pack.wargearSetupCount}`,
      "",
      "Primary input file: `docs/wh40k_app_manual_pass_pack.md`.",
      "",
      "Recommended loop:",
      "",
      "```bash",
      "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-results docs/wh40k_app_manual_pass_pack.md --allow-pending",
      "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --status --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_status.md",
      "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --next-action --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_next_action.md",
      "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract next-pending-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_next_batch.md",
      "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending",
      "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --merge-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md > updated-pass-pack.md",
      "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract action-backlog --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_action_backlog.md",
      "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract minimum-checklist --from docs/wh40k_app_manual_pass_pack.md > updated-minimum-checklist.md",
      "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract wargear-results --from docs/wh40k_app_manual_pass_pack.md > filled-wargear-results.md",
      "```",
      "",
      "Fill only the WH app result, diagnostic, parity, and action columns in the pass pack. Keep `blocked` for setups a UI cannot express.",
      "",
      "Action rule of thumb: `match -> none`, `mismatch -> logic|builder-ui`, `blocked -> official-ui-blocked|builder-ui`.",
      "",
      "## Minimum UI Batches",
      "",
      "| Batch | Pass-pack rows | Case ids | Builder tests |",
      "| --- | --- | --- | --- |",
    ];

    for (const group of minimumGroups) {
      lines.push([
        markdownCell(group.name),
        markdownCell(group.rows.map((row) => row.rowNumber).join(", ")),
        markdownCell(group.rows.map((row) => `\`${row.id}\``).join(", ")),
        markdownCell(uniqueValues(group.rows.map((row) => row.file)).join(", ")),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }

    lines.push(
      "",
      "## Wargear Roster Batches",
      "",
      "| Roster context | Pass-pack rows | Units | Case ids |",
      "| --- | --- | --- | --- |",
    );

    for (const group of wargearGroups) {
      lines.push([
        markdownCell(group.name),
        markdownCell(group.rows.map((row) => row.rowNumber).join(", ")),
        markdownCell(uniqueValues(group.rows.map((row) => row.unit)).join(", ")),
        markdownCell(uniqueValues(group.rows.map((row) => `\`${row.caseId}\``)).join(", ")),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }

    lines.push(
      "",
      "## Completion Gates",
      "",
      "- `--check-results` without `--allow-pending` must return `match` before the manual pass is complete.",
      "- Extracted minimum checklist must pass `export_minimum_parity_manifest.mjs --check-results`.",
      "- Extracted wargear worksheet must pass `export_wargear_parity_manifest.mjs --check-results`.",
    );

    return lines.join("\n");
  }

  return {
    actionCounts,
    blockingStructuralCount,
    emptyActionCounts,
    emptyStatusCounts,
    groupedMinimumRows,
    groupedWargearRows,
    markdownNextActionOutput,
    markdownStatusOutput,
    minimumActualStatus,
    nextActionSummary,
    passPackStatus,
    runbookOutput,
    statusCounts,
    wargearActualStatus,
  };
}

export { createManualWh40kPassPackWorkflow };
