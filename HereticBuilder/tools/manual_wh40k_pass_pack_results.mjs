import { readFileSync } from "node:fs";

import { minimumParityConceptByCode } from "../../tests/builder_validation_minimum_parity_manifest.test.mjs";
import { builderExpectation, conceptList } from "./manual_wh40k_pass_pack_expectations.mjs";
import {
  actionBacklogBlockingFailures,
  createManualWh40kPassPackBatchWorkflow,
} from "./manual_wh40k_pass_pack_batches.mjs";
import { createMinimumSubcheckBatchWorkflow } from "./manual_wh40k_pass_pack_subchecks.mjs";
import { createManualWh40kPassPackWorkflow } from "./manual_wh40k_pass_pack_workflow.mjs";
import { actionValues, checklistPath } from "./manual_wh40k_pass_pack_config.mjs";
import {
  cleanMarkdownCell,
  markdownCell,
  markdownSection,
  splitMarkdownRow,
} from "./manual_wh40k_pass_pack_markdown.mjs";

function passPackMinimumRows(markdown) {
  const rows = [];
  for (const line of markdownSection(markdown, "## Minimum Manual UI Cases").split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) {
      continue;
    }
    const cells = splitMarkdownRow(line);
    if (cells.length < 7 || cells[0] === "#" || /^-+$/.test(cells[0])) {
      continue;
    }
    rows.push({
      action: cleanMarkdownCell(cells[7] || "Pending"),
      caseId: cleanMarkdownCell(cells[1]),
      evidenceNote: cleanMarkdownCell(cells[8] || "Pending"),
      whAppScenario: cleanMarkdownCell(cells[4]),
      whAppResult: cleanMarkdownCell(cells[5]),
      parity: cleanMarkdownCell(cells[6]).toLowerCase(),
    });
  }
  return rows;
}

function passPackWargearRows(markdown) {
  const rows = [];
  for (const line of markdownSection(markdown, "## Wargear UI Cases").split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) {
      continue;
    }
    const cells = splitMarkdownRow(line);
    if (cells.length < 11 || cells[0] === "#" || /^-+$/.test(cells[0])) {
      continue;
    }
    rows.push({
      action: cleanMarkdownCell(cells[11] || "Pending"),
      caseId: cleanMarkdownCell(cells[1]),
      detachment: cleanMarkdownCell(cells[5]),
      evidenceNote: cleanMarkdownCell(cells[12] || "Pending"),
      expectedState: cleanMarkdownCell(cells[2]).toLowerCase(),
      rosterFaction: cleanMarkdownCell(cells[4]),
      unit: cleanMarkdownCell(cells[6]),
      wargearSetup: cleanMarkdownCell(cells[7]),
      whAppDiagnostic: cleanMarkdownCell(cells[9]),
      whAppState: cleanMarkdownCell(cells[8]).toLowerCase(),
      parity: cleanMarkdownCell(cells[10]).toLowerCase(),
    });
  }
  return rows;
}

function minimumKey(row) {
  return row.caseId;
}

function wargearKey(row) {
  return [
    row.caseId,
    row.rosterFaction,
    row.detachment,
    row.unit,
  ].join("\u0000");
}

function isPendingValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "pending";
}

function normalizeAction(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || "pending";
}

function expectedActionsForStatus(status) {
  if (status === "pending") {
    return ["pending"];
  }
  if (status === "match") {
    return ["none"];
  }
  if (status === "mismatch") {
    return ["logic", "builder-ui"];
  }
  if (status === "blocked") {
    return ["official-ui-blocked", "builder-ui"];
  }
  return actionValues;
}

function actionMismatch(row, status) {
  const action = normalizeAction(row.action);
  const expectedActions = expectedActionsForStatus(status);
  if (!actionValues.includes(action) || !expectedActions.includes(action)) {
    return {
      ...row,
      action,
      expectedActions,
    };
  }
  return null;
}

function evidenceNoteMismatch(row, status) {
  if (!["match", "mismatch", "blocked"].includes(status)) {
    return null;
  }
  if (isPendingValue(row.evidenceNote)) {
    return {
      ...row,
      status,
    };
  }
  return null;
}

function checkMinimumPassPackRows(pack, markdown) {
  const expectedRows = pack.minimumRows.map((row) => ({
    caseId: row.id,
  }));
  const expectedByKey = new Map(expectedRows.map((row) => [minimumKey(row), row]));
  const actualRows = passPackMinimumRows(markdown);
  const actualByKey = new Map();
  const duplicateRows = [];
  for (const row of actualRows) {
    const key = minimumKey(row);
    if (actualByKey.has(key)) {
      duplicateRows.push(row);
    }
    actualByKey.set(key, row);
  }

  const missingRows = expectedRows.filter((row) => !actualByKey.has(minimumKey(row)));
  const unexpectedRows = actualRows.filter((row) => !expectedByKey.has(minimumKey(row)));
  const actionMismatches = [];
  const evidenceMismatches = [];
  const pendingRows = [];
  const invalidParityRows = [];

  for (const expected of expectedRows) {
    const actual = actualByKey.get(minimumKey(expected));
    if (!actual) {
      continue;
    }
    if ([actual.whAppResult, actual.parity].some(isPendingValue)) {
      pendingRows.push(actual);
      const mismatch = actionMismatch(actual, "pending");
      if (mismatch) {
        actionMismatches.push(mismatch);
      }
      continue;
    }
    if (!["match", "mismatch", "blocked"].includes(actual.parity)) {
      invalidParityRows.push(actual);
      continue;
    }
    const mismatch = actionMismatch(actual, actual.parity);
    if (mismatch) {
      actionMismatches.push(mismatch);
    }
    const evidenceMismatch = evidenceNoteMismatch(actual, actual.parity);
    if (evidenceMismatch) {
      evidenceMismatches.push(evidenceMismatch);
    }
  }

  return {
    actionMismatches,
    duplicateRows,
    evidenceMismatches,
    expectedRows: expectedRows.length,
    invalidParityRows,
    missingRows,
    parsedRows: actualRows.length,
    pendingRows,
    unexpectedRows,
  };
}

function checkWargearPassPackRows(pack, markdown) {
  const expectedRows = pack.wargearRows.map((row) => ({
    caseId: row.caseId,
    detachment: row.detachment,
    expectedState: row.expectedState,
    rosterFaction: row.rosterFaction,
    unit: row.unit,
  }));
  const expectedByKey = new Map(expectedRows.map((row) => [wargearKey(row), row]));
  const actualRows = passPackWargearRows(markdown);
  const actualByKey = new Map();
  const duplicateRows = [];
  for (const row of actualRows) {
    const key = wargearKey(row);
    if (actualByKey.has(key)) {
      duplicateRows.push(row);
    }
    actualByKey.set(key, row);
  }

  const missingRows = expectedRows.filter((row) => !actualByKey.has(wargearKey(row)));
  const unexpectedRows = actualRows.filter((row) => !expectedByKey.has(wargearKey(row)));
  const actionMismatches = [];
  const evidenceMismatches = [];
  const parityMismatches = [];
  const pendingRows = [];
  const stateMismatches = [];

  for (const expected of expectedRows) {
    const actual = actualByKey.get(wargearKey(expected));
    if (!actual) {
      continue;
    }
    if ([actual.whAppState, actual.whAppDiagnostic, actual.parity].some(isPendingValue)) {
      pendingRows.push(actual);
      const mismatch = actionMismatch(actual, "pending");
      if (mismatch) {
        actionMismatches.push(mismatch);
      }
      continue;
    }
    if (actual.parity === "blocked") {
      const mismatch = actionMismatch(actual, actual.parity);
      if (mismatch) {
        actionMismatches.push(mismatch);
      }
      const evidenceMismatch = evidenceNoteMismatch(actual, actual.parity);
      if (evidenceMismatch) {
        evidenceMismatches.push(evidenceMismatch);
      }
      continue;
    }
    if (!["valid", "invalid"].includes(actual.whAppState) || actual.whAppState !== expected.expectedState) {
      stateMismatches.push({
        ...actual,
        expectedState: expected.expectedState,
      });
    }
    const expectedParity = actual.whAppState === expected.expectedState ? "match" : "mismatch";
    if (!["match", "mismatch", "blocked"].includes(actual.parity) || (actual.parity !== "blocked" && actual.parity !== expectedParity)) {
      parityMismatches.push({
        ...actual,
        expectedParity,
      });
      continue;
    }
    const mismatch = actionMismatch(actual, actual.parity);
    if (mismatch) {
      actionMismatches.push(mismatch);
    }
    const evidenceMismatch = evidenceNoteMismatch(actual, actual.parity);
    if (evidenceMismatch) {
      evidenceMismatches.push(evidenceMismatch);
    }
  }

  return {
    actionMismatches,
    duplicateRows,
    evidenceMismatches,
    expectedRows: expectedRows.length,
    missingRows,
    parsedRows: actualRows.length,
    parityMismatches,
    pendingRows,
    stateMismatches,
    unexpectedRows,
  };
}

function passPackResultStatus(summary, allowPending) {
  const hardFailures = summary.minimum.actionMismatches.length +
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
    summary.wargear.stateMismatches.length +
    summary.wargear.unexpectedRows.length;
  if (hardFailures) {
    return "mismatch";
  }
  if (summary.minimum.pendingRows.length || summary.wargear.pendingRows.length) {
    return allowPending ? "pending" : "incomplete";
  }
  return "match";
}

function checkPassPackResults(pack, markdown, options = {}) {
  const summary = {
    minimum: checkMinimumPassPackRows(pack, markdown),
    wargear: checkWargearPassPackRows(pack, markdown),
  };
  return {
    status: passPackResultStatus(summary, options.allowPending),
    ...summary,
  };
}

const {
  actionCounts,
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
} = createManualWh40kPassPackWorkflow({
  actionValues,
  checkPassPackResults,
  isPendingValue,
  markdownCell,
  normalizeAction,
  passPackMinimumRows,
  passPackWargearRows,
  wargearKey,
});

const {
  mergeMinimumSubcheckBatchIntoPassPack,
  minimumSubcheckBatchCheckSummary,
  minimumSubcheckBatchMarkdown,
} = createMinimumSubcheckBatchWorkflow({
  actionCounts,
  actionMismatch,
  cleanMarkdownCell,
  conceptByCode: minimumParityConceptByCode,
  evidenceNoteMismatch,
  groupedMinimumRows,
  isPendingValue,
  markdownCell,
  normalizeAction,
  passPackStatus,
  splitMarkdownRow,
  statusCounts,
});

function resultDisplayValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.toLowerCase() === "pending") {
    return "Pending";
  }
  return normalized;
}

const {
  mergeNextBatchIntoPassPack,
  nextBatchCheckSummary,
  nextPendingBatchMarkdown,
} = createManualWh40kPassPackBatchWorkflow({
  actionCounts,
  checkPassPackResults,
  cleanMarkdownCell,
  conceptByCode: minimumParityConceptByCode,
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
});

function replaceMinimumChecklistRows(checklistMarkdown, passPackRows) {
  const rowsByCaseId = new Map(passPackRows.map((row) => [row.caseId, row]));
  let inMinimumSection = false;
  return checklistMarkdown.split(/\r?\n/).map((line) => {
    if (line.startsWith("## Minimum manifest parity groups")) {
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
    if (cells.length < 4 || cells[0] === "Case id" || /^-+$/.test(cells[0])) {
      return line;
    }
    const caseId = cleanMarkdownCell(cells[0]);
    const passPackRow = rowsByCaseId.get(caseId);
    if (!passPackRow) {
      return line;
    }
    return [
      `\`${markdownCell(caseId)}\``,
      markdownCell(passPackRow.whAppScenario),
      markdownCell(resultDisplayValue(passPackRow.whAppResult)),
      markdownCell(resultDisplayValue(passPackRow.parity)),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |");
  }).join("\n");
}

function wargearResultsMarkdown(pack, passPackRows) {
  const rowsByKey = new Map(passPackRows.map((row) => [wargearKey(row), row]));
  const lines = [
    "# WH 40K app wargear parity results",
    "",
    `Data version: ${pack.dataVersion}`,
    `Cases: ${pack.wargearCaseCount}`,
    `WH app UI setups: ${pack.wargearSetupCount}`,
    "",
    "| Case id | Expected | Codes | Roster faction | Detachment | Unit | Wargear setup | WH app state | WH app diagnostic | Parity |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of pack.wargearRows) {
    const passPackRow = rowsByKey.get(wargearKey(row));
    if (!passPackRow) {
      throw new Error(`Missing pass-pack wargear row: ${row.caseId} / ${row.rosterFaction} / ${row.detachment} / ${row.unit}`);
    }
    lines.push([
      `\`${markdownCell(row.caseId)}\``,
      markdownCell(row.expectedState),
      markdownCell(row.codes.length ? row.codes.join(", ") : "none"),
      markdownCell(row.rosterFaction),
      markdownCell(row.detachment),
      markdownCell(row.unit),
      markdownCell(row.wargearSetup),
      markdownCell(resultDisplayValue(passPackRow.whAppState)),
      markdownCell(resultDisplayValue(passPackRow.whAppDiagnostic)),
      markdownCell(resultDisplayValue(passPackRow.parity)),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  return lines.join("\n");
}

function followUpText(action) {
  if (action === "logic") {
    return "Fix Builder validator/model/catalog interpretation.";
  }
  if (action === "builder-ui") {
    return "Fix Builder UI path for this user-relevant scenario.";
  }
  if (action === "official-ui-blocked") {
    return "No Builder UI change implied; official WH 40K app UI cannot express the scenario.";
  }
  return "No follow-up.";
}

function actionableRows(pack, markdown) {
  const minimumById = new Map(passPackMinimumRows(markdown).map((row) => [row.caseId, row]));
  const wargearByKey = new Map(passPackWargearRows(markdown).map((row) => [wargearKey(row), row]));
  const rows = [];

  pack.minimumRows.forEach((row, index) => {
    const actual = minimumById.get(row.id);
    const action = normalizeAction(actual?.action);
    if (!["logic", "builder-ui", "official-ui-blocked"].includes(action)) {
      return;
    }
    rows.push({
      action,
      caseId: row.id,
      context: row.file,
      diagnostic: actual?.whAppResult || "",
      evidenceNote: actual?.evidenceNote || "",
      followUp: followUpText(action),
      rowNumber: index + 1,
      section: "Minimum UI",
      status: minimumActualStatus(actual),
    });
  });

  pack.wargearRows.forEach((row, index) => {
    const actual = wargearByKey.get(wargearKey(row));
    const action = normalizeAction(actual?.action);
    if (!["logic", "builder-ui", "official-ui-blocked"].includes(action)) {
      return;
    }
    rows.push({
      action,
      caseId: row.caseId,
      context: `${row.rosterFaction} / ${row.detachment} / ${row.unit}`,
      diagnostic: [actual?.whAppState, actual?.whAppDiagnostic].filter(Boolean).join(": "),
      evidenceNote: actual?.evidenceNote || "",
      followUp: followUpText(action),
      rowNumber: index + 1,
      section: "Wargear UI",
      status: wargearActualStatus(row, actual),
    });
  });

  return rows;
}

function actionBacklogMarkdown(pack, markdown) {
  const status = passPackStatus(pack, markdown);
  const rows = actionableRows(pack, markdown);
  const lines = [
    "# WH 40K app manual action backlog",
    "",
    "Date: 2026-07-03",
    "",
    `Data version: ${pack.dataVersion}`,
    `Total rows: ${status.totalRows}`,
    `Pending rows: ${status.totals.pending}`,
    `Logic actions: ${status.actionTotals.logic}`,
    `Builder UI actions: ${status.actionTotals["builder-ui"]}`,
    `Official UI blocked rows: ${status.actionTotals["official-ui-blocked"]}`,
    "",
  ];

  if (!rows.length) {
    lines.push(
      "No actionable follow-ups yet.",
      "",
      "Rows with `Action: pending` still need WH app UI results before they can become `none`, `logic`, `builder-ui`, or `official-ui-blocked`.",
    );
    return lines.join("\n");
  }

  lines.push(
    "| Action | Section | Pass-pack row | Case id | Status | Context | WH app result/diagnostic | Evidence note | Follow-up |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );

  for (const row of rows) {
    lines.push([
      markdownCell(row.action),
      markdownCell(row.section),
      String(row.rowNumber),
      `\`${markdownCell(row.caseId)}\``,
      markdownCell(row.status),
      markdownCell(row.context),
      markdownCell(row.diagnostic || "n/a"),
      markdownCell(row.evidenceNote || "n/a"),
      markdownCell(row.followUp),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  return lines.join("\n");
}

function extractResults(pack, markdown, mode) {
  const summary = checkPassPackResults(pack, markdown, { allowPending: true });
  if (mode === "action-backlog" || mode === "minimum-subcheck-batch" || mode === "next-pending-batch") {
    if (actionBacklogBlockingFailures(summary)) {
      console.log(JSON.stringify(summary, null, 2));
      process.exit(1);
    }
  }
  if (mode === "action-backlog") {
    return actionBacklogMarkdown(pack, markdown);
  }
  if (mode === "minimum-subcheck-batch") {
    return minimumSubcheckBatchMarkdown(pack, markdown);
  }
  if (mode === "next-pending-batch") {
    return nextPendingBatchMarkdown(pack, markdown);
  }
  if (summary.status === "mismatch") {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(1);
  }
  if (mode === "minimum-checklist") {
    return replaceMinimumChecklistRows(
      readFileSync(checklistPath, "utf8"),
      passPackMinimumRows(markdown),
    );
  }
  if (mode === "wargear-results") {
    return wargearResultsMarkdown(pack, passPackWargearRows(markdown));
  }
  throw new Error(`Unsupported extract mode: ${mode}`);
}

export {
  actionBacklogBlockingFailures,
  actionBacklogMarkdown,
  checkPassPackResults,
  extractResults,
  markdownNextActionOutput,
  markdownStatusOutput,
  mergeMinimumSubcheckBatchIntoPassPack,
  mergeNextBatchIntoPassPack,
  minimumSubcheckBatchCheckSummary,
  minimumSubcheckBatchMarkdown,
  nextActionSummary,
  nextBatchCheckSummary,
  nextPendingBatchMarkdown,
  passPackMinimumRows,
  passPackStatus,
  passPackWargearRows,
  runbookOutput,
};
