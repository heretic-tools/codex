#!/usr/bin/env node

import { wargearParityManifest } from "../../tests/builder_validation_wargear_parity_cases.test.mjs";
import { readFileSync } from "node:fs";

function usage() {
  return [
    "Usage: node export_wargear_parity_manifest.mjs [--format json|markdown]",
    "       node export_wargear_parity_manifest.mjs --check-results results.md [--allow-pending]",
    "",
    "Exports the executable WH app wargear parity manifest.",
    "JSON is the default. Markdown is a human-readable WH app setup table.",
    "--check-results validates a filled markdown table against the manifest.",
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

function wargearList(items) {
  if (!items?.length) {
    return "none";
  }
  return items
    .map((item) => `${item.count} ${item.name}`)
    .join("; ");
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

function markdownOutput(manifest) {
  const lines = [
    "# WH 40K app wargear parity setups",
    "",
    `Data version: ${manifest.dataVersion}`,
    `Cases: ${manifest.caseCount}`,
    `WH app UI setups: ${manifest.setupCount}`,
    "",
    "| Case id | Expected | Codes | Roster faction | Detachment | Unit | Wargear setup | WH app state | WH app diagnostic | Parity |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const parityCase of manifest.cases) {
    for (const setup of parityCase.uiSetups) {
      const unit = parityCase.units.find((candidate) => candidate.datasheetId === setup.datasheetId);
      lines.push([
        `\`${markdownCell(parityCase.id)}\``,
        markdownCell(parityCase.expectedState),
        markdownCell(parityCase.expectedCodes.length ? parityCase.expectedCodes.join(", ") : "none"),
        markdownCell(setup.rosterFactionName),
        markdownCell(setup.detachmentName),
        markdownCell(setup.datasheetName),
        markdownCell(unit ? unitWargearSummary(unit) : "missing unit data"),
        "Pending",
        "Pending",
        "Pending",
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
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

function setupKey(row) {
  return [
    row.caseId,
    row.rosterFaction,
    row.detachment,
    row.unit,
  ].join("\u0000");
}

function expectedSetupRows(manifest) {
  return manifest.cases.flatMap((parityCase) => (
    parityCase.uiSetups.map((setup) => ({
      caseId: parityCase.id,
      codes: parityCase.expectedCodes,
      detachment: setup.detachmentName,
      expectedState: parityCase.expectedState,
      rosterFaction: setup.rosterFactionName,
      unit: setup.datasheetName,
    }))
  ));
}

function parseResultRows(markdown) {
  const rows = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) {
      continue;
    }
    const cells = splitMarkdownRow(line);
    if (cells.length < 10 || cells[0] === "Case id" || /^-+$/.test(cells[0])) {
      continue;
    }
    rows.push({
      caseId: cleanMarkdownCell(cells[0]),
      expectedState: cleanMarkdownCell(cells[1]).toLowerCase(),
      codes: cleanMarkdownCell(cells[2]),
      rosterFaction: cleanMarkdownCell(cells[3]),
      detachment: cleanMarkdownCell(cells[4]),
      unit: cleanMarkdownCell(cells[5]),
      whAppState: cleanMarkdownCell(cells[7]).toLowerCase(),
      whAppDiagnostic: cleanMarkdownCell(cells[8]),
      parity: cleanMarkdownCell(cells[9]).toLowerCase(),
    });
  }
  return rows;
}

function checkResults(manifest, markdown) {
  const expectedRows = expectedSetupRows(manifest);
  const expectedByKey = new Map(expectedRows.map((row) => [setupKey(row), row]));
  const actualRows = parseResultRows(markdown);
  const actualByKey = new Map();
  const duplicateRows = [];
  for (const row of actualRows) {
    const key = setupKey(row);
    if (actualByKey.has(key)) {
      duplicateRows.push(row);
    }
    actualByKey.set(key, row);
  }

  const missingRows = expectedRows.filter((row) => !actualByKey.has(setupKey(row)));
  const unexpectedRows = actualRows.filter((row) => !expectedByKey.has(setupKey(row)));
  const pendingRows = [];
  const stateMismatches = [];
  const parityMismatches = [];

  for (const expected of expectedRows) {
    const actual = actualByKey.get(setupKey(expected));
    if (!actual) {
      continue;
    }
    const pending = [actual.whAppState, actual.whAppDiagnostic.toLowerCase(), actual.parity]
      .some((value) => value === "pending" || !value);
    if (pending) {
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

function resultSummaryStatus(summary, allowPending) {
  const hardFailures = summary.duplicateRows.length +
    summary.missingRows.length +
    summary.parityMismatches.length +
    summary.stateMismatches.length +
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
const manifest = wargearParityManifest();
if (args.checkResultsPath) {
  const summary = checkResults(manifest, readFileSync(args.checkResultsPath, "utf8"));
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
