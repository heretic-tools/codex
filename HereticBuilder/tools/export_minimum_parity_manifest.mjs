#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
  manualMinimumParityCaseIds,
  minimumParityCases,
  minimumParityConceptByCode,
} from "../../tests/builder_validation_minimum_parity_manifest.test.mjs";

function usage() {
  return [
    "Usage: node export_minimum_parity_manifest.mjs [--format json|markdown]",
    "       node export_minimum_parity_manifest.mjs --check-results results.md [--allow-pending]",
    "       node export_minimum_parity_manifest.mjs --check-results results.md --allow-manual-pending-only",
    "",
    "Exports the executable WH app minimum parity manifest.",
    "JSON is the default. Markdown is a human-readable WH app result table.",
    "--check-results validates the minimum parity result table.",
    "--allow-manual-pending-only permits pending rows only for manual WH app UI cases.",
  ].join("\n");
}

function parseArgs(argv) {
  const result = {
    allowManualPendingOnly: false,
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
    if (arg === "--allow-manual-pending-only") {
      result.allowManualPendingOnly = true;
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

function conceptsForCodes(codes) {
  return [...new Set((codes || []).map((code) => minimumParityConceptByCode[code] || "unmapped"))];
}

const manualPendingCaseIds = new Set(manualMinimumParityCaseIds);

function minimumParityManifest() {
  return {
    caseCount: minimumParityCases.length,
    manualCaseCount: manualPendingCaseIds.size,
    cases: minimumParityCases.map((parityCase) => ({
      id: parityCase.id,
      file: parityCase.file,
      anchors: parityCase.anchors,
      codes: parityCase.codes,
      comparisonMode: manualPendingCaseIds.has(parityCase.id) ? "manual-wh-app-ui" : "guard-evidence",
      concepts: conceptsForCodes(parityCase.codes),
    })),
  };
}

function markdownOutput(manifest) {
  const lines = [
    "# WH 40K app minimum parity manifest",
    "",
    `Cases: ${manifest.caseCount}`,
    "",
    "| Case id | Test file | Codes | Concepts | WH app method | WH app result | Parity |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const parityCase of manifest.cases) {
    lines.push([
      `\`${markdownCell(parityCase.id)}\``,
      markdownCell(parityCase.file),
      markdownCell(parityCase.codes.length ? parityCase.codes.join(", ") : "none"),
      markdownCell(parityCase.concepts.length ? parityCase.concepts.join(", ") : "none"),
      "Pending",
      "Pending",
      "Pending",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  return lines.join("\n");
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

function parseResultRows(markdown) {
  const rows = [];
  for (const line of minimumResultSection(markdown).split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) {
      continue;
    }
    const cells = splitMarkdownRow(line);
    if (cells.length < 4 || cells[0] === "Case id" || /^-+$/.test(cells[0])) {
      continue;
    }
    const generatedWorksheetRow = cells.length >= 7;
    rows.push({
      caseId: cleanMarkdownCell(cells[0]),
      whAppMethod: cleanMarkdownCell(generatedWorksheetRow ? cells[4] : cells[1]),
      whAppResult: cleanMarkdownCell(generatedWorksheetRow ? cells[5] : cells[2]),
      parity: cleanMarkdownCell(generatedWorksheetRow ? cells[6] : cells[3]).toLowerCase(),
    });
  }
  return rows;
}

function resultKey(row) {
  return row.caseId;
}

function checkResults(manifest, markdown, options = {}) {
  const expectedRows = manifest.cases.map((parityCase) => ({
    caseId: parityCase.id,
    comparisonMode: parityCase.comparisonMode,
  }));
  const expectedByKey = new Map(expectedRows.map((row) => [resultKey(row), row]));
  const actualRows = parseResultRows(markdown);
  const actualByKey = new Map();
  const duplicateRows = [];
  for (const row of actualRows) {
    const key = resultKey(row);
    if (actualByKey.has(key)) {
      duplicateRows.push(row);
    }
    actualByKey.set(key, row);
  }

  const missingRows = expectedRows.filter((row) => !actualByKey.has(resultKey(row)));
  const unexpectedRows = actualRows.filter((row) => !expectedByKey.has(resultKey(row)));
  const disallowedPendingRows = [];
  const pendingRows = [];
  const invalidParityRows = [];

  for (const expected of expectedRows) {
    const actual = actualByKey.get(resultKey(expected));
    if (!actual) {
      continue;
    }
    const pending = [actual.whAppMethod, actual.whAppResult, actual.parity]
      .some((value) => String(value || "").toLowerCase() === "pending" || !value);
    if (pending) {
      const pendingRow = {
        ...actual,
        comparisonMode: expected.comparisonMode,
      };
      pendingRows.push(pendingRow);
      if (options.allowManualPendingOnly && expected.comparisonMode !== "manual-wh-app-ui") {
        disallowedPendingRows.push(pendingRow);
      }
      continue;
    }
    if (!["match", "mismatch", "blocked"].includes(actual.parity)) {
      invalidParityRows.push(actual);
    }
  }

  return {
    disallowedPendingRows,
    duplicateRows,
    expectedRows: expectedRows.length,
    invalidParityRows,
    missingRows,
    parsedRows: actualRows.length,
    pendingRows,
    unexpectedRows,
  };
}

function resultSummaryStatus(summary, allowPending) {
  const hardFailures = summary.disallowedPendingRows.length +
    summary.duplicateRows.length +
    summary.invalidParityRows.length +
    summary.missingRows.length +
    summary.unexpectedRows.length;
  if (hardFailures) {
    return "mismatch";
  }
  if (summary.pendingRows.length) {
    return allowPending ? "pending" : "incomplete";
  }
  return "match";
}

const args = parseArgs(process.argv.slice(2));
const manifest = minimumParityManifest();
if (args.checkResultsPath) {
  const summary = checkResults(manifest, readFileSync(args.checkResultsPath, "utf8"), {
    allowManualPendingOnly: args.allowManualPendingOnly,
  });
  const status = resultSummaryStatus(summary, args.allowPending);
  console.log(JSON.stringify({ status, ...summary }, null, 2));
  if (status !== "match" && !(args.allowPending && status === "pending")) {
    process.exit(1);
  }
} else if (args.format === "markdown") {
  console.log(markdownOutput(manifest));
} else {
  console.log(JSON.stringify(manifest, null, 2));
}
