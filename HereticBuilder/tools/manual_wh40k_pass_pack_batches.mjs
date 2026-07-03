import {
  builderExpectation,
  conceptList,
  subcheckList,
} from "./manual_wh40k_pass_pack_expectations.mjs";

function createManualWh40kPassPackBatchWorkflow(deps) {
  const {
    actionCounts,
    checkPassPackResults,
    cleanMarkdownCell,
    conceptByCode,
    emptyActionCounts,
    emptyStatusCounts,
    groupedMinimumRows,
    groupedWargearRows,
    isPendingValue,
    markdownCell,
    normalizeAction,
    passPackMinimumRows,
    passPackStatus,
    passPackWargearRows,
    resultDisplayValue,
    splitMarkdownRow,
    statusCounts,
    wargearKey,
  } = deps;

  function nextPendingBatchMarkdown(pack, markdown) {
    const status = passPackStatus(pack, markdown);
    const nextBatch = status.nextPendingBatch;
    const lines = [
      "# WH 40K app next pending batch",
      "",
      "Date: 2026-07-03",
      "",
      `Data version: ${pack.dataVersion}`,
      `Total pending rows: ${status.totals.pending}`,
      "",
    ];

    if (!nextBatch) {
      lines.push("No pending batch.");
      return lines.join("\n");
    }

    lines.push(
      `Section: ${nextBatch.section}`,
      `Batch: ${nextBatch.name}`,
      `Pass-pack rows: ${nextBatch.pendingRows.join(", ")}`,
      "",
    );

    if (nextBatch.section === "Minimum UI") {
      const actualById = new Map(passPackMinimumRows(markdown).map((row) => [row.caseId, row]));
      const batch = groupedMinimumRows(pack.minimumRows).find((group) => group.name === nextBatch.name);
      const pendingRows = batch.rows.filter((row) => nextBatch.pendingRows.includes(row.rowNumber));
      lines.push(
        "| Row | Case id | Builder test | Codes | WH app scenario | WH app result | Parity | Action | Evidence note | Builder expectation | Official concepts | Subchecks |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
      );
      for (const row of pendingRows) {
        const actual = actualById.get(row.id);
        lines.push([
          String(row.rowNumber),
          `\`${markdownCell(row.id)}\``,
          markdownCell(row.file),
          markdownCell(row.codes.length ? row.codes.join(", ") : "none"),
          markdownCell(row.whAppMethod),
          markdownCell(resultDisplayValue(actual?.whAppResult)),
          markdownCell(resultDisplayValue(actual?.parity)),
          markdownCell(resultDisplayValue(actual?.action)),
          markdownCell(resultDisplayValue(actual?.evidenceNote)),
          markdownCell(builderExpectation(row.codes)),
          markdownCell(conceptList(row.codes, conceptByCode)),
          markdownCell(subcheckList(row.subchecks)),
        ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
      }
      return lines.join("\n");
    }

    const actualByKey = new Map(passPackWargearRows(markdown).map((row) => [wargearKey(row), row]));
    const batch = groupedWargearRows(pack.wargearRows).find((group) => group.name === nextBatch.name);
    const pendingRows = batch.rows.filter((row) => nextBatch.pendingRows.includes(row.rowNumber));
    lines.push(
      "| Row | Case id | Expected | Codes | Roster faction | Detachment | Unit | Wargear setup | WH app state | WH app diagnostic | Parity | Action | Evidence note | Builder expectation | Official concepts |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const row of pendingRows) {
      const actual = actualByKey.get(wargearKey(row));
      lines.push([
        String(row.rowNumber),
        `\`${markdownCell(row.caseId)}\``,
        markdownCell(row.expectedState),
        markdownCell(row.codes.length ? row.codes.join(", ") : "none"),
        markdownCell(row.rosterFaction),
        markdownCell(row.detachment),
        markdownCell(row.unit),
        markdownCell(row.wargearSetup),
        markdownCell(resultDisplayValue(actual?.whAppState)),
        markdownCell(resultDisplayValue(actual?.whAppDiagnostic)),
        markdownCell(resultDisplayValue(actual?.parity)),
        markdownCell(resultDisplayValue(actual?.action)),
        markdownCell(resultDisplayValue(actual?.evidenceNote)),
        markdownCell(builderExpectation(row.codes, row.expectedState)),
        markdownCell(conceptList(row.codes, conceptByCode)),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }

    return lines.join("\n");
  }

  function nextBatchSection(batchMarkdown) {
    const match = batchMarkdown.match(/^Section:\s*(.+)$/m);
    return match ? match[1].trim() : "";
  }

  function nextBatchName(batchMarkdown) {
    const match = batchMarkdown.match(/^Batch:\s*(.+)$/m);
    return match ? match[1].trim() : "";
  }

  function nextBatchRows(batchMarkdown) {
    const section = nextBatchSection(batchMarkdown);
    if (!section && batchMarkdown.includes("No pending batch.")) {
      return { rows: [], section: "" };
    }
    if (!["Minimum UI", "Wargear UI"].includes(section)) {
      throw new Error(`Unsupported next batch section: ${section || "<missing>"}`);
    }

    const rows = [];
    for (const line of batchMarkdown.split(/\r?\n/)) {
      if (!line.trim().startsWith("|")) {
        continue;
      }
      const cells = splitMarkdownRow(line);
      if (cells.length < 2 || cells[0] === "Row" || /^-+$/.test(cells[0])) {
        continue;
      }
      if (section === "Minimum UI") {
        if (cells.length < 8) {
          throw new Error(`Malformed minimum next-batch row: ${line}`);
        }
        rows.push({
          action: cleanMarkdownCell(cells[7]),
          caseId: cleanMarkdownCell(cells[1]),
          evidenceNote: cleanMarkdownCell(cells[8] || "Pending"),
          parity: cleanMarkdownCell(cells[6]),
          rowNumber: Number(cleanMarkdownCell(cells[0])),
          whAppResult: cleanMarkdownCell(cells[5]),
        });
        continue;
      }
      if (cells.length < 12) {
        throw new Error(`Malformed wargear next-batch row: ${line}`);
      }
      rows.push({
        action: cleanMarkdownCell(cells[11]),
        caseId: cleanMarkdownCell(cells[1]),
        detachment: cleanMarkdownCell(cells[5]),
        evidenceNote: cleanMarkdownCell(cells[12] || "Pending"),
        expectedState: cleanMarkdownCell(cells[2]).toLowerCase(),
        parity: cleanMarkdownCell(cells[10]),
        rosterFaction: cleanMarkdownCell(cells[4]),
        rowNumber: Number(cleanMarkdownCell(cells[0])),
        unit: cleanMarkdownCell(cells[6]),
        whAppDiagnostic: cleanMarkdownCell(cells[9]),
        whAppState: cleanMarkdownCell(cells[8]),
      });
    }

    return { rows, section };
  }

  function nextBatchRowStatus(section, row) {
    if (section === "Minimum UI") {
      if ([row.whAppResult, row.parity].some(isPendingValue)) {
        return "pending";
      }
      if (["match", "mismatch", "blocked"].includes(String(row.parity || "").toLowerCase())) {
        return String(row.parity).toLowerCase();
      }
      return "invalid";
    }

    if ([row.whAppState, row.whAppDiagnostic, row.parity].some(isPendingValue)) {
      return "pending";
    }
    const whAppState = String(row.whAppState || "").toLowerCase();
    const parity = String(row.parity || "").toLowerCase();
    if (parity === "blocked") {
      return "blocked";
    }
    if (!["valid", "invalid"].includes(whAppState) || !["match", "mismatch"].includes(parity)) {
      return "invalid";
    }
    const expectedParity = whAppState === row.expectedState ? "match" : "mismatch";
    return parity === expectedParity ? parity : "invalid";
  }

  function nextBatchCheckSummary(pack, passPackMarkdown, batchMarkdown) {
    const { rows, section } = nextBatchRows(batchMarkdown);
    if (!rows.length) {
      return {
        actionTotals: emptyActionCounts(),
        batch: nextBatchName(batchMarkdown),
        counts: emptyStatusCounts(),
        parsedRows: 0,
        rowNumbers: [],
        rows: [],
        section,
        status: "empty",
      };
    }

    const mergedMarkdown = mergeNextBatchIntoPassPack(passPackMarkdown, batchMarkdown);
    const structuralSummary = checkPassPackResults(pack, mergedMarkdown, { allowPending: true });
    const hardFailures = actionBacklogBlockingFailures(structuralSummary);
    const checkedRows = rows.map((row) => ({
      action: normalizeAction(row.action),
      caseId: row.caseId,
      rowNumber: row.rowNumber,
      section,
      status: nextBatchRowStatus(section, row),
      unit: row.unit || "",
    }));
    const counts = statusCounts(checkedRows);
    const status = hardFailures || counts.invalid
      ? "mismatch"
      : counts.pending
        ? "pending"
        : "ready";

    return {
      actionTotals: actionCounts(checkedRows),
      batch: nextBatchName(batchMarkdown),
      counts,
      parsedRows: rows.length,
      rowNumbers: rows.map((row) => row.rowNumber),
      rows: checkedRows,
      section,
      status,
      structuralStatus: structuralSummary.status,
      structuralSummary: {
        minimumActionMismatches: structuralSummary.minimum.actionMismatches.length,
        minimumDuplicateRows: structuralSummary.minimum.duplicateRows.length,
        minimumEvidenceMismatches: structuralSummary.minimum.evidenceMismatches.length,
        minimumInvalidParityRows: structuralSummary.minimum.invalidParityRows.length,
        minimumMissingRows: structuralSummary.minimum.missingRows.length,
        minimumUnexpectedRows: structuralSummary.minimum.unexpectedRows.length,
        wargearActionMismatches: structuralSummary.wargear.actionMismatches.length,
        wargearDuplicateRows: structuralSummary.wargear.duplicateRows.length,
        wargearEvidenceMismatches: structuralSummary.wargear.evidenceMismatches.length,
        wargearMissingRows: structuralSummary.wargear.missingRows.length,
        wargearParityMismatches: structuralSummary.wargear.parityMismatches.length,
        wargearStateMismatches: structuralSummary.wargear.stateMismatches.length,
        wargearUnexpectedRows: structuralSummary.wargear.unexpectedRows.length,
      },
    };
  }

  function passPackDataLine(cells) {
    return cells.join(" | ").replace(/^/, "| ").replace(/$/, " |");
  }

  function mergeNextBatchIntoPassPack(passPackMarkdown, batchMarkdown) {
    const { rows, section } = nextBatchRows(batchMarkdown);
    if (!rows.length) {
      return passPackMarkdown;
    }

    const rowsByKey = new Map(rows.map((row) => {
      const key = section === "Minimum UI" ? row.caseId : wargearKey(row);
      return [key, row];
    }));
    const foundKeys = new Set();
    let inMinimumSection = false;
    let inWargearSection = false;

    const merged = passPackMarkdown.split(/\r?\n/).map((line) => {
      if (line.startsWith("## Minimum Manual UI Cases")) {
        inMinimumSection = true;
        inWargearSection = false;
        return line;
      }
      if (line.startsWith("## Wargear UI Cases")) {
        inMinimumSection = false;
        inWargearSection = true;
        return line;
      }
      if (line.startsWith("## Completion Rule")) {
        inMinimumSection = false;
        inWargearSection = false;
        return line;
      }
      if (!line.trim().startsWith("|")) {
        return line;
      }

      if (section === "Minimum UI" && inMinimumSection) {
        const cells = splitMarkdownRow(line);
        if (cells.length < 8 || cells[0] === "#" || /^-+$/.test(cells[0])) {
          return line;
        }
        const caseId = cleanMarkdownCell(cells[1]);
        const row = rowsByKey.get(caseId);
        if (!row) {
          return line;
        }
        foundKeys.add(caseId);
        return passPackDataLine([
          cells[0],
          cells[1],
          cells[2],
          cells[3],
          cells[4],
          markdownCell(resultDisplayValue(row.whAppResult)),
          markdownCell(resultDisplayValue(row.parity)),
          markdownCell(resultDisplayValue(row.action)),
          markdownCell(resultDisplayValue(row.evidenceNote)),
          cells[9] || markdownCell(""),
          cells[10] || markdownCell(""),
          cells[11] || markdownCell(""),
        ]);
      }

      if (section === "Wargear UI" && inWargearSection) {
        const cells = splitMarkdownRow(line);
        if (cells.length < 12 || cells[0] === "#" || /^-+$/.test(cells[0])) {
          return line;
        }
        const key = wargearKey({
          caseId: cleanMarkdownCell(cells[1]),
          detachment: cleanMarkdownCell(cells[5]),
          rosterFaction: cleanMarkdownCell(cells[4]),
          unit: cleanMarkdownCell(cells[6]),
        });
        const row = rowsByKey.get(key);
        if (!row) {
          return line;
        }
        foundKeys.add(key);
        return passPackDataLine([
          cells[0],
          cells[1],
          cells[2],
          cells[3],
          cells[4],
          cells[5],
          cells[6],
          cells[7],
          markdownCell(resultDisplayValue(row.whAppState)),
          markdownCell(resultDisplayValue(row.whAppDiagnostic)),
          markdownCell(resultDisplayValue(row.parity)),
          markdownCell(resultDisplayValue(row.action)),
          markdownCell(resultDisplayValue(row.evidenceNote)),
          cells[13] || markdownCell(""),
          cells[14] || markdownCell(""),
        ]);
      }

      return line;
    }).join("\n");

    const missingKeys = [...rowsByKey.keys()].filter((key) => !foundKeys.has(key));
    if (missingKeys.length) {
      throw new Error(`Next-batch rows missing in pass pack: ${missingKeys.join(", ")}`);
    }
    return merged;
  }

  return {
    mergeNextBatchIntoPassPack,
    nextBatchCheckSummary,
    nextPendingBatchMarkdown,
  };
}

function actionBacklogBlockingFailures(summary) {
  return summary.minimum.actionMismatches.length +
    summary.minimum.duplicateRows.length +
    summary.minimum.evidenceMismatches.length +
    summary.minimum.invalidParityRows.length +
    summary.minimum.missingRows.length +
    summary.minimum.unexpectedRows.length +
    summary.wargear.actionMismatches.length +
    summary.wargear.duplicateRows.length +
    summary.wargear.evidenceMismatches.length +
    summary.wargear.missingRows.length +
    summary.wargear.parityMismatches.length +
    summary.wargear.unexpectedRows.length;
}

export {
  actionBacklogBlockingFailures,
  createManualWh40kPassPackBatchWorkflow,
};
