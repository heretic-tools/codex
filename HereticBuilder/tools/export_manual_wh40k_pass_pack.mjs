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

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = dirname(dirname(dirname(currentFile)));
const checklistPath = join(projectRoot, "docs", "wh40k_app_manual_parity_checklist.md");

function usage() {
  return [
    "Usage: node export_manual_wh40k_pass_pack.mjs [--format json|markdown]",
    "       node export_manual_wh40k_pass_pack.mjs --check-results pass-pack.md [--allow-pending]",
    "",
    "Exports the current manual WH app pass pack:",
    "- 17 minimum parity UI/golden-case rows still allowed to remain pending",
    "- 26 wargear UI setup rows from the executable wargear manifest",
    "--check-results validates a filled pass-pack markdown file against both sections.",
  ].join("\n");
}

function parseArgs(argv) {
  const result = {
    allowPending: false,
    checkResultsPath: "",
    format: "json",
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
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["json", "markdown"].includes(result.format)) {
    throw new Error(`Unsupported format: ${result.format || "<empty>"}`);
  }
  if (argv.includes("--check-results") && !result.checkResultsPath) {
    throw new Error("--check-results requires a markdown file path");
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
  const pendingRows = [];
  const invalidParityRows = [];

  for (const expected of expectedRows) {
    const actual = actualByKey.get(minimumKey(expected));
    if (!actual) {
      continue;
    }
    if ([actual.whAppResult, actual.parity].some(isPendingValue)) {
      pendingRows.push(actual);
      continue;
    }
    if (!["match", "mismatch", "blocked"].includes(actual.parity)) {
      invalidParityRows.push(actual);
    }
  }

  return {
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
    }
  }

  return {
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
  const hardFailures = summary.minimum.duplicateRows.length +
    summary.minimum.invalidParityRows.length +
    summary.minimum.missingRows.length +
    summary.minimum.unexpectedRows.length +
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
    "Date: 2026-07-02",
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
    "node HereticBuilder/tools/export_minimum_parity_manifest.mjs --check-results docs/wh40k_app_manual_parity_checklist.md --allow-manual-pending-only",
    "node HereticBuilder/tools/export_wargear_parity_manifest.mjs --check-results filled-wargear-results.md --allow-pending",
    "```",
    "",
    "## Minimum Manual UI Cases",
    "",
    "| # | Case id | Builder test | Codes | WH app scenario | WH app result | Parity |",
    "| --- | --- | --- | --- | --- | --- | --- |",
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
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  });

  lines.push(
    "",
    "## Wargear UI Cases",
    "",
    "| # | Case id | Expected | Codes | Roster faction | Detachment | Unit | Wargear setup | WH app state | WH app diagnostic | Parity |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
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
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  });

  lines.push(
    "",
    "## Completion Rule",
    "",
    "Do not mark a row `match` until the official WH 40K app UI and Builder agree on valid/invalid state and diagnostic family. Use `mismatch` for a proven difference and `blocked` only when the app UI cannot express the setup.",
  );

  return lines.join("\n");
}

const args = parseArgs(process.argv.slice(2));
const pack = manualPassPack();
if (args.checkResultsPath) {
  const summary = checkPassPackResults(pack, readFileSync(args.checkResultsPath, "utf8"), {
    allowPending: args.allowPending,
  });
  console.log(JSON.stringify(summary, null, 2));
  if (summary.status !== "match" && !(args.allowPending && summary.status === "pending")) {
    process.exit(1);
  }
} else if (args.format === "markdown") {
  console.log(markdownOutput(pack));
} else {
  console.log(JSON.stringify(pack, null, 2));
}
