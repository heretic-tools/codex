#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  manualMinimumParityCaseIds,
  minimumParityCases,
  minimumParityConceptByCode,
} from "../../tests/builder_validation_minimum_parity_manifest.test.mjs";
import { wargearParityManifest } from "../../tests/builder_validation_wargear_parity_cases.test.mjs";
import { createManualWh40kPassPackWorkflow } from "./manual_wh40k_pass_pack_workflow.mjs";

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = dirname(dirname(dirname(currentFile)));
const checklistPath = join(projectRoot, "docs", "wh40k_app_manual_parity_checklist.md");
const actionValues = ["pending", "none", "logic", "builder-ui", "official-ui-blocked"];
const extractModes = ["action-backlog", "minimum-checklist", "next-pending-batch", "wargear-results"];

function usage() {
  return [
    "Usage: node export_manual_wh40k_pass_pack.mjs [--format json|markdown|runbook]",
    "       node export_manual_wh40k_pass_pack.mjs --check-results pass-pack.md [--allow-pending]",
    "       node export_manual_wh40k_pass_pack.mjs --check-batch next-batch.md --from pass-pack.md [--allow-pending]",
    "       node export_manual_wh40k_pass_pack.mjs --next-action --from pass-pack.md [--format json|markdown]",
    "       node export_manual_wh40k_pass_pack.mjs --status --from pass-pack.md [--format json|markdown]",
    "       node export_manual_wh40k_pass_pack.mjs --extract action-backlog --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --extract minimum-checklist --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --extract next-pending-batch --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --extract wargear-results --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --merge-batch next-batch.md --from pass-pack.md",
    "",
    "Exports the current manual WH app pass pack:",
    "- 17 minimum parity UI/golden-case rows still allowed to remain pending",
    "- 26 wargear UI setup rows from the executable wargear manifest",
    "--check-results validates a filled pass-pack markdown file against both sections.",
    "--status summarizes pass-pack completion by runbook batch.",
    "--next-action emits the next workflow step and command bundle.",
    "--extract emits checkable result markdown derived from a filled pass pack.",
    "--merge-batch emits a pass-pack candidate with a filled current batch merged in.",
    "--format runbook emits the grouped manual execution order.",
  ].join("\n");
}

function parseArgs(argv) {
  const result = {
    allowPending: false,
    checkBatchPath: "",
    checkResultsPath: "",
    extractFromPath: "",
    extractMode: "",
    format: "json",
    mergeBatchPath: "",
    nextActionMode: false,
    statusMode: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }
    if (arg === "--format") {
      result.format = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg === "--check-results") {
      result.checkResultsPath = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg === "--check-batch") {
      result.checkBatchPath = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg === "--extract") {
      result.extractMode = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg === "--from") {
      result.extractFromPath = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg === "--merge-batch") {
      result.mergeBatchPath = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg === "--next-action") {
      result.nextActionMode = true;
      continue;
    }
    if (arg === "--status") {
      result.statusMode = true;
      continue;
    }
    if (arg === "--allow-pending") {
      result.allowPending = true;
      continue;
    }
    if (arg === "--json") {
      result.format = "json";
      continue;
    }
    if (arg === "--markdown") {
      result.format = "markdown";
      continue;
    }
    if (arg === "--runbook") {
      result.format = "runbook";
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["json", "markdown", "runbook"].includes(result.format)) {
    throw new Error(`Unsupported format: ${result.format || "<empty>"}`);
  }
  if (argv.includes("--check-results") && !result.checkResultsPath) {
    throw new Error("--check-results requires a markdown file path");
  }
  if (argv.includes("--check-batch") && !result.checkBatchPath) {
    throw new Error("--check-batch requires a next-batch markdown file path");
  }
  if (result.extractMode && !extractModes.includes(result.extractMode)) {
    throw new Error(`Unsupported extract mode: ${result.extractMode}`);
  }
  if (result.extractMode && result.statusMode) {
    throw new Error("--status cannot be combined with --extract");
  }
  if (result.nextActionMode && (result.extractMode || result.statusMode || result.checkResultsPath || result.checkBatchPath || result.mergeBatchPath)) {
    throw new Error("--next-action cannot be combined with --extract, --status, --check-results, --check-batch, or --merge-batch");
  }
  if (result.checkBatchPath && (result.extractMode || result.statusMode || result.checkResultsPath || result.mergeBatchPath)) {
    throw new Error("--check-batch cannot be combined with --extract, --status, --check-results, or --merge-batch");
  }
  if (result.mergeBatchPath && (result.extractMode || result.statusMode || result.checkResultsPath || result.checkBatchPath)) {
    throw new Error("--merge-batch cannot be combined with --extract, --status, --check-results, or --check-batch");
  }
  if (result.extractMode && !result.extractFromPath) {
    throw new Error("--extract requires --from pass-pack.md");
  }
  if (argv.includes("--merge-batch") && !result.mergeBatchPath) {
    throw new Error("--merge-batch requires a next-batch markdown file path");
  }
  if (result.mergeBatchPath && !result.extractFromPath) {
    throw new Error("--merge-batch requires --from pass-pack.md");
  }
  if (result.checkBatchPath && !result.extractFromPath) {
    throw new Error("--check-batch requires --from pass-pack.md");
  }
  if (result.statusMode && !result.extractFromPath) {
    throw new Error("--status requires --from pass-pack.md");
  }
  if (result.nextActionMode && !result.extractFromPath) {
    throw new Error("--next-action requires --from pass-pack.md");
  }
  if ((result.statusMode || result.nextActionMode) && result.format === "runbook") {
    throw new Error("--status and --next-action support --format json|markdown");
  }
  if (result.extractFromPath && !result.extractMode && !result.statusMode && !result.mergeBatchPath && !result.checkBatchPath && !result.nextActionMode) {
    throw new Error("--from requires --extract action-backlog|minimum-checklist|next-pending-batch|wargear-results or --status");
  }
  return result;
}

function markdownCell(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

function splitMarkdownRow(row) {
  const trimmed = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let cell = "";
  let escaped = false;
  for (const char of trimmed) {
    if (escaped) {
      cell += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "|") {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

function cleanMarkdownCell(value) {
  return String(value || "")
    .trim()
    .replace(/^`|`$/g, "")
    .replaceAll("<br>", "\n");
}

function minimumResultSection(markdown) {
  const marker = "## Minimum manifest parity groups";
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex === -1) {
    return markdown;
  }
  const afterMarker = markdown.slice(markerIndex + marker.length);
  const nextSectionIndex = afterMarker.search(/\n## /);
  return nextSectionIndex === -1 ? afterMarker : afterMarker.slice(0, nextSectionIndex);
}

function markdownSection(markdown, marker) {
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex === -1) {
    return "";
  }
  const afterMarker = markdown.slice(markerIndex + marker.length);
  const nextSectionIndex = afterMarker.search(/\n## /);
  return nextSectionIndex === -1 ? afterMarker : afterMarker.slice(0, nextSectionIndex);
}

function parseMinimumChecklistRows(markdown) {
  const rows = new Map();
  for (const line of minimumResultSection(markdown).split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) {
      continue;
    }
    const cells = splitMarkdownRow(line);
    if (cells.length < 4 || cells[0] === "Case id" || /^-+$/.test(cells[0])) {
      continue;
    }
    const row = {
      caseId: cleanMarkdownCell(cells[0]),
      whAppMethod: cleanMarkdownCell(cells[1]),
      whAppResult: cleanMarkdownCell(cells[2]),
      parity: cleanMarkdownCell(cells[3]),
    };
    rows.set(row.caseId, row);
  }
  return rows;
}

function conceptsForCodes(codes) {
  return [...new Set((codes || []).map((code) => minimumParityConceptByCode[code] || "unmapped"))];
}

function wargearList(items) {
  if (!items?.length) {
    return "none";
  }
  return items.map((item) => `${item.count} ${item.name}`).join("; ");
}

function unitWargearSummary(unit) {
  const rows = [];
  if (unit.unitWargear?.length) {
    rows.push(`Unit: ${wargearList(unit.unitWargear)}`);
  }
  for (const miniature of unit.miniatures || []) {
    rows.push(`${miniature.name} x${miniature.count}: ${wargearList(miniature.wargear)}`);
  }
  return rows.join("<br>");
}

function manualMinimumRows() {
  const checklistRows = parseMinimumChecklistRows(readFileSync(checklistPath, "utf8"));
  const casesById = new Map(minimumParityCases.map((parityCase) => [parityCase.id, parityCase]));
  return manualMinimumParityCaseIds.map((caseId) => {
    const parityCase = casesById.get(caseId);
    const checklistRow = checklistRows.get(caseId);
    if (!parityCase || !checklistRow) {
      throw new Error(`Manual parity case is not present in checklist: ${caseId}`);
    }
    return {
      id: caseId,
      file: parityCase.file,
      codes: parityCase.codes,
      concepts: conceptsForCodes(parityCase.codes),
      whAppMethod: checklistRow.whAppMethod,
      whAppResult: checklistRow.whAppResult,
      parity: checklistRow.parity,
    };
  });
}

function wargearRows(manifest) {
  return manifest.cases.flatMap((parityCase) => (
    parityCase.uiSetups.map((setup) => {
      const unit = parityCase.units.find((candidate) => candidate.datasheetId === setup.datasheetId);
      return {
        caseId: parityCase.id,
        expectedState: parityCase.expectedState,
        codes: parityCase.expectedCodes,
        rosterFaction: setup.rosterFactionName,
        detachment: setup.detachmentName,
        unit: setup.datasheetName,
        wargearSetup: unit ? unitWargearSummary(unit) : "missing unit data",
        whAppState: "Pending",
        whAppDiagnostic: "Pending",
        parity: "Pending",
      };
    })
  ));
}

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
  }

  return {
    actionMismatches,
    duplicateRows,
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
  }

  return {
    actionMismatches,
    duplicateRows,
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
    summary.minimum.invalidParityRows.length +
    summary.minimum.missingRows.length +
    summary.minimum.unexpectedRows.length +
    summary.wargear.actionMismatches.length +
    summary.wargear.duplicateRows.length +
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

function resultDisplayValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.toLowerCase() === "pending") {
    return "Pending";
  }
  return normalized;
}

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
    "| Action | Section | Pass-pack row | Case id | Status | Context | WH app result/diagnostic | Follow-up |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
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
      markdownCell(row.followUp),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  return lines.join("\n");
}

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
      "| Row | Case id | Builder test | Codes | WH app scenario | WH app result | Parity | Action |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
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
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
    return lines.join("\n");
  }

  const actualByKey = new Map(passPackWargearRows(markdown).map((row) => [wargearKey(row), row]));
  const batch = groupedWargearRows(pack.wargearRows).find((group) => group.name === nextBatch.name);
  const pendingRows = batch.rows.filter((row) => nextBatch.pendingRows.includes(row.rowNumber));
  lines.push(
    "| Row | Case id | Expected | Codes | Roster faction | Detachment | Unit | Wargear setup | WH app state | WH app diagnostic | Parity | Action |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
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

function actionBacklogBlockingFailures(summary) {
  return summary.minimum.actionMismatches.length +
    summary.minimum.duplicateRows.length +
    summary.minimum.invalidParityRows.length +
    summary.minimum.missingRows.length +
    summary.minimum.unexpectedRows.length +
    summary.wargear.actionMismatches.length +
    summary.wargear.duplicateRows.length +
    summary.wargear.missingRows.length +
    summary.wargear.parityMismatches.length +
    summary.wargear.unexpectedRows.length;
}

function extractResults(pack, markdown, mode) {
  const summary = checkPassPackResults(pack, markdown, { allowPending: true });
  if (mode === "action-backlog" || mode === "next-pending-batch") {
    if (actionBacklogBlockingFailures(summary)) {
      console.log(JSON.stringify(summary, null, 2));
      process.exit(1);
    }
  }
  if (mode === "action-backlog") {
    return actionBacklogMarkdown(pack, markdown);
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

function manualPassPack() {
  const wargearManifest = wargearParityManifest();
  const minimumRows = manualMinimumRows();
  const wargearSetupRows = wargearRows(wargearManifest);
  return {
    dataVersion: wargearManifest.dataVersion,
    minimumManualCaseCount: minimumRows.length,
    wargearCaseCount: wargearManifest.caseCount,
    wargearSetupCount: wargearSetupRows.length,
    minimumRows,
    wargearRows: wargearSetupRows,
  };
}

function markdownOutput(pack) {
  const lines = [
    "# WH 40K app manual pass pack",
    "",
    "Date: 2026-07-03",
    "",
    "Scope: focused checklist for official WH 40K app UI work that still cannot be proven from local DB/bundle/export guards.",
    "",
    `Data version: ${pack.dataVersion}`,
    `Minimum manual UI/golden cases: ${pack.minimumManualCaseCount}`,
    `Wargear UI setups: ${pack.wargearSetupCount}`,
    "",
    "Validation commands:",
    "",
    "```bash",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-results docs/wh40k_app_manual_pass_pack.md --allow-pending",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --status --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_status.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --next-action --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_next_action.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract next-pending-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_next_batch.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --merge-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md > updated-pass-pack.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract action-backlog --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_action_backlog.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --format runbook > docs/wh40k_app_manual_runbook.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract minimum-checklist --from docs/wh40k_app_manual_pass_pack.md > updated-minimum-checklist.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract wargear-results --from docs/wh40k_app_manual_pass_pack.md > filled-wargear-results.md",
    "node HereticBuilder/tools/export_minimum_parity_manifest.mjs --check-results docs/wh40k_app_manual_parity_checklist.md --allow-manual-pending-only",
    "node HereticBuilder/tools/export_wargear_parity_manifest.mjs --check-results filled-wargear-results.md --allow-pending",
    "```",
    "",
    "## Minimum Manual UI Cases",
    "",
    "| # | Case id | Builder test | Codes | WH app scenario | WH app result | Parity | Action |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  pack.minimumRows.forEach((row, index) => {
    lines.push([
      String(index + 1),
      `\`${markdownCell(row.id)}\``,
      markdownCell(row.file),
      markdownCell(row.codes.length ? row.codes.join(", ") : "none"),
      markdownCell(row.whAppMethod),
      markdownCell(row.whAppResult),
      markdownCell(row.parity),
      "Pending",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  });

  lines.push(
    "",
    "## Wargear UI Cases",
    "",
    "| # | Case id | Expected | Codes | Roster faction | Detachment | Unit | Wargear setup | WH app state | WH app diagnostic | Parity | Action |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );

  pack.wargearRows.forEach((row, index) => {
    lines.push([
      String(index + 1),
      `\`${markdownCell(row.caseId)}\``,
      markdownCell(row.expectedState),
      markdownCell(row.codes.length ? row.codes.join(", ") : "none"),
      markdownCell(row.rosterFaction),
      markdownCell(row.detachment),
      markdownCell(row.unit),
      markdownCell(row.wargearSetup),
      markdownCell(row.whAppState),
      markdownCell(row.whAppDiagnostic),
      markdownCell(row.parity),
      "Pending",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  });

  lines.push(
    "",
    "## Completion Rule",
    "",
    "Do not mark a row `match` until the official WH 40K app UI and Builder agree on valid/invalid state and diagnostic family. Use `mismatch` for a proven difference and `blocked` only when a UI cannot express the setup.",
    "",
    "Action values:",
    "",
    "- `pending`: row is not checked yet.",
    "- `none`: `match`; no Builder change is needed.",
    "- `logic`: `mismatch`; fix validator/model/catalog interpretation.",
    "- `builder-ui`: `mismatch` or `blocked`; fix Builder UI because our app cannot express a user-relevant scenario.",
    "- `official-ui-blocked`: `blocked`; official WH 40K app UI cannot express the scenario, so no Builder UI change is implied.",
  );

  return lines.join("\n");
}

const args = parseArgs(process.argv.slice(2));
const pack = manualPassPack();
if (args.checkBatchPath) {
  const summary = nextBatchCheckSummary(
    pack,
    readFileSync(args.extractFromPath, "utf8"),
    readFileSync(args.checkBatchPath, "utf8"),
  );
  console.log(JSON.stringify(summary, null, 2));
  if (summary.status === "mismatch" || (summary.status === "pending" && !args.allowPending)) {
    process.exit(1);
  }
} else if (args.mergeBatchPath) {
  const mergedMarkdown = mergeNextBatchIntoPassPack(
    readFileSync(args.extractFromPath, "utf8"),
    readFileSync(args.mergeBatchPath, "utf8"),
  );
  const summary = checkPassPackResults(pack, mergedMarkdown, { allowPending: true });
  if (actionBacklogBlockingFailures(summary)) {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(1);
  }
  console.log(mergedMarkdown);
} else if (args.nextActionMode) {
  const summary = nextActionSummary(passPackStatus(pack, readFileSync(args.extractFromPath, "utf8")));
  if (args.format === "markdown") {
    console.log(markdownNextActionOutput(summary));
  } else {
    console.log(JSON.stringify(summary, null, 2));
  }
} else if (args.statusMode) {
  const status = passPackStatus(pack, readFileSync(args.extractFromPath, "utf8"));
  if (args.format === "markdown") {
    console.log(markdownStatusOutput(status));
  } else {
    console.log(JSON.stringify(status, null, 2));
  }
} else if (args.extractMode) {
  console.log(extractResults(pack, readFileSync(args.extractFromPath, "utf8"), args.extractMode));
} else if (args.checkResultsPath) {
  const summary = checkPassPackResults(pack, readFileSync(args.checkResultsPath, "utf8"), {
    allowPending: args.allowPending,
  });
  console.log(JSON.stringify(summary, null, 2));
  if (summary.status !== "match" && !(args.allowPending && summary.status === "pending")) {
    process.exit(1);
  }
} else if (args.format === "markdown") {
  console.log(markdownOutput(pack));
} else if (args.format === "runbook") {
  console.log(runbookOutput(pack));
} else {
  console.log(JSON.stringify(pack, null, 2));
}
