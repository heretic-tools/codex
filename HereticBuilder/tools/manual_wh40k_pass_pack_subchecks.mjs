import {
  builderExpectation,
  conceptList,
  subcheckExpectedObservation,
} from "./manual_wh40k_pass_pack_expectations.mjs";

function createMinimumSubcheckBatchWorkflow(deps) {
  const {
    actionCounts,
    actionMismatch,
    cleanMarkdownCell,
    conceptByCode,
    evidenceNoteMismatch,
    groupedMinimumRows,
    isPendingValue,
    markdownCell,
    normalizeAction,
    passPackStatus,
    splitMarkdownRow,
    statusCounts,
  } = deps;

  function minimumSubcheckBatchMarkdown(pack, markdown) {
    const status = passPackStatus(pack, markdown);
    const nextBatch = status.nextPendingBatch;
    const lines = [
      "# WH 40K app minimum subcheck batch",
      "",
      "Date: 2026-07-03",
      "",
      `Data version: ${pack.dataVersion}`,
      `Total minimum subchecks: ${pack.minimumManualSubcheckCount}`,
      `Total pending rows: ${status.totals.pending}`,
      "",
    ];

    if (!nextBatch || nextBatch.section !== "Minimum UI") {
      lines.push("No pending minimum subcheck batch.");
      return lines.join("\n");
    }

    const batch = groupedMinimumRows(pack.minimumRows).find((group) => group.name === nextBatch.name);
    const pendingRows = batch.rows.filter((row) => nextBatch.pendingRows.includes(row.rowNumber));
    const subcheckCount = pendingRows.reduce((total, row) => total + row.subchecks.length, 0);
    lines.push(
      `Section: ${nextBatch.section}`,
      `Batch: ${nextBatch.name}`,
      `Pass-pack rows: ${nextBatch.pendingRows.join(", ")}`,
      `Batch subchecks: ${subcheckCount}`,
      "",
      "| Pass-pack row | Subcheck # | Case id | Codes | Builder expectation | Official concepts | Subcheck | Setup hint | Expected state | Expected diagnostic | WH app subcheck result | Parity | Action | Evidence note |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    );

    for (const row of pendingRows) {
      row.subchecks.forEach((subcheck, subcheckIndex) => {
        const setupHint = row.setupHints?.[subcheckIndex] || "Use the pass-pack scenario and Builder fixture anchors for this subcheck.";
        const expectedObservation = subcheckExpectedObservation(row.codes, subcheck);
        lines.push([
          String(row.rowNumber),
          String(subcheckIndex + 1),
          `\`${markdownCell(row.id)}\``,
          markdownCell(row.codes.length ? row.codes.join(", ") : "none"),
          markdownCell(builderExpectation(row.codes)),
          markdownCell(conceptList(row.codes, conceptByCode)),
          markdownCell(subcheck),
          markdownCell(setupHint),
          markdownCell(expectedObservation.state),
          markdownCell(expectedObservation.diagnostic),
          "Pending",
          "Pending",
          "Pending",
          "Pending",
        ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
      });
    }

    return lines.join("\n");
  }

  function parseMinimumSubcheckBatchRows(markdown) {
    if (markdown.includes("No pending minimum subcheck batch.")) {
      return [];
    }
    const rows = [];
    for (const line of markdown.split(/\r?\n/)) {
      if (!line.trim().startsWith("|")) {
        continue;
      }
      const cells = splitMarkdownRow(line);
      if (cells.length < 14 || cells[0] === "Pass-pack row" || /^-+$/.test(cells[0])) {
        continue;
      }
      rows.push({
        action: cleanMarkdownCell(cells[12]),
        caseId: cleanMarkdownCell(cells[2]),
        evidenceNote: cleanMarkdownCell(cells[13]),
        expectedDiagnostic: cleanMarkdownCell(cells[9]),
        expectedState: cleanMarkdownCell(cells[8]).toLowerCase(),
        parity: cleanMarkdownCell(cells[11]).toLowerCase(),
        rowNumber: Number(cleanMarkdownCell(cells[0])),
        subcheck: cleanMarkdownCell(cells[6]),
        subcheckNumber: Number(cleanMarkdownCell(cells[1])),
        whAppResult: cleanMarkdownCell(cells[10]),
      });
    }
    return rows;
  }

  function minimumSubcheckKey(row) {
    return `${row.caseId}\u0000${row.subcheckNumber}\u0000${row.subcheck}`;
  }

  function expectedMinimumSubcheckRows(pack, markdown) {
    const status = passPackStatus(pack, markdown);
    const nextBatch = status.nextPendingBatch;
    if (!nextBatch || nextBatch.section !== "Minimum UI") {
      return [];
    }
    const batch = groupedMinimumRows(pack.minimumRows).find((group) => group.name === nextBatch.name);
    return batch.rows
      .filter((row) => nextBatch.pendingRows.includes(row.rowNumber))
      .flatMap((row) => row.subchecks.map((subcheck, index) => ({
        caseId: row.id,
        rowNumber: row.rowNumber,
        subcheck,
        subcheckNumber: index + 1,
      })));
  }

  function minimumSubcheckStatus(row) {
    if ([row.whAppResult, row.parity].some(isPendingValue)) {
      return "pending";
    }
    if (["match", "mismatch", "blocked"].includes(row.parity)) {
      return row.parity;
    }
    return "invalid";
  }

  function minimumSubcheckBatchCheckSummary(pack, passPackMarkdown, subcheckMarkdown) {
    const expectedRows = expectedMinimumSubcheckRows(pack, passPackMarkdown);
    const expectedByKey = new Map(expectedRows.map((row) => [minimumSubcheckKey(row), row]));
    const actualRows = parseMinimumSubcheckBatchRows(subcheckMarkdown);
    const actualByKey = new Map();
    const duplicateRows = [];
    for (const row of actualRows) {
      const key = minimumSubcheckKey(row);
      if (actualByKey.has(key)) {
        duplicateRows.push(row);
      }
      actualByKey.set(key, row);
    }

    const missingRows = expectedRows.filter((row) => !actualByKey.has(minimumSubcheckKey(row)));
    const unexpectedRows = actualRows.filter((row) => !expectedByKey.has(minimumSubcheckKey(row)));
    const actionMismatches = [];
    const evidenceMismatches = [];
    const invalidParityRows = [];
    const checkedRows = [];

    for (const actual of actualRows) {
      const status = minimumSubcheckStatus(actual);
      checkedRows.push({
        action: normalizeAction(actual.action),
        caseId: actual.caseId,
        rowNumber: actual.rowNumber,
        section: "Minimum UI subcheck",
        status,
      });
      if (status === "invalid") {
        invalidParityRows.push(actual);
        continue;
      }
      const actionProblem = actionMismatch(actual, status);
      if (actionProblem) {
        actionMismatches.push(actionProblem);
      }
      const evidenceProblem = evidenceNoteMismatch(actual, status);
      if (evidenceProblem) {
        evidenceMismatches.push(evidenceProblem);
      }
    }

    const counts = statusCounts(checkedRows);
    const hardFailures = duplicateRows.length +
      missingRows.length +
      unexpectedRows.length +
      actionMismatches.length +
      evidenceMismatches.length +
      invalidParityRows.length;
    return {
      actionMismatches,
      actionTotals: actionCounts(checkedRows),
      counts,
      duplicateRows,
      evidenceMismatches,
      expectedRows: expectedRows.length,
      invalidParityRows,
      missingRows,
      parsedRows: actualRows.length,
      rowNumbers: actualRows.map((row) => row.rowNumber),
      rows: checkedRows,
      status: hardFailures ? "mismatch" : counts.pending ? "pending" : expectedRows.length ? "ready" : "empty",
      unexpectedRows,
    };
  }

  function aggregateSubcheckRows(rows) {
    const counts = {
      blocked: rows.filter((row) => minimumSubcheckStatus(row) === "blocked").length,
      match: rows.filter((row) => minimumSubcheckStatus(row) === "match").length,
      mismatch: rows.filter((row) => minimumSubcheckStatus(row) === "mismatch").length,
    };
    const parity = counts.mismatch ? "mismatch" : counts.blocked ? "blocked" : "match";
    let action = "none";
    if (parity === "mismatch") {
      action = rows.some((row) => normalizeAction(row.action) === "logic") ? "logic" : "builder-ui";
    } else if (parity === "blocked") {
      action = rows.some((row) => normalizeAction(row.action) === "builder-ui") ? "builder-ui" : "official-ui-blocked";
    }
    const parts = [
      `${rows.length} subchecks`,
      `${counts.match} match`,
      `${counts.mismatch} mismatch`,
      `${counts.blocked} blocked`,
    ];
    return {
      action,
      evidenceNote: `Derived from filled minimum subcheck batch: ${parts.join(", ")}.`,
      parity,
      whAppResult: parts.join(", "),
    };
  }

  function passPackDataLine(cells) {
    return cells.join(" | ").replace(/^/, "| ").replace(/$/, " |");
  }

  function mergeMinimumSubcheckBatchIntoPassPack(pack, passPackMarkdown, subcheckMarkdown) {
    const summary = minimumSubcheckBatchCheckSummary(pack, passPackMarkdown, subcheckMarkdown);
    if (summary.status !== "ready") {
      throw new Error(`Minimum subcheck batch is not ready: ${summary.status}`);
    }

    const rowsByCaseId = new Map();
    for (const row of parseMinimumSubcheckBatchRows(subcheckMarkdown)) {
      if (!rowsByCaseId.has(row.caseId)) {
        rowsByCaseId.set(row.caseId, []);
      }
      rowsByCaseId.get(row.caseId).push(row);
    }

    const foundCaseIds = new Set();
    let inMinimumSection = false;
    const merged = passPackMarkdown.split(/\r?\n/).map((line) => {
      if (line.startsWith("## Minimum Manual UI Cases")) {
        inMinimumSection = true;
        return line;
      }
      if (inMinimumSection && line.startsWith("## ")) {
        inMinimumSection = false;
        return line;
      }
      if (!inMinimumSection || !line.trim().startsWith("|")) {
        return line;
      }

      const cells = splitMarkdownRow(line);
      if (cells.length < 8 || cells[0] === "#" || /^-+$/.test(cells[0])) {
        return line;
      }
      const caseId = cleanMarkdownCell(cells[1]);
      const subcheckRows = rowsByCaseId.get(caseId);
      if (!subcheckRows) {
        return line;
      }
      foundCaseIds.add(caseId);
      const aggregate = aggregateSubcheckRows(subcheckRows);
      return passPackDataLine([
        cells[0],
        cells[1],
        cells[2],
        cells[3],
        cells[4],
        markdownCell(aggregate.whAppResult),
        markdownCell(aggregate.parity),
        markdownCell(aggregate.action),
        markdownCell(aggregate.evidenceNote),
        cells[9] || markdownCell(""),
        cells[10] || markdownCell(""),
        cells[11] || markdownCell(""),
      ]);
    }).join("\n");

    const missingCaseIds = [...rowsByCaseId.keys()].filter((caseId) => !foundCaseIds.has(caseId));
    if (missingCaseIds.length) {
      throw new Error(`Subcheck rows missing in pass pack: ${missingCaseIds.join(", ")}`);
    }
    return merged;
  }

  return {
    mergeMinimumSubcheckBatchIntoPassPack,
    minimumSubcheckBatchCheckSummary,
    minimumSubcheckBatchMarkdown,
    parseMinimumSubcheckBatchRows,
  };
}

export { createMinimumSubcheckBatchWorkflow };
