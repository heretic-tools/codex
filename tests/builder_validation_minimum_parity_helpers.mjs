import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function testMarkdownCell(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

function testSplitMarkdownRow(row) {
  return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim().replaceAll("\\|", "|"));
}

function testCleanMarkdownCell(value) {
  return String(value || "").trim().replace(/^`|`$/g, "").replaceAll("<br>", "\n");
}

function testIsPendingValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "pending";
}

function testNormalizeAction(value) {
  return String(value || "").trim().toLowerCase() || "pending";
}

function testStatusCounts(rows) {
  const counts = { blocked: 0, invalid: 0, match: 0, mismatch: 0, pending: 0 };
  for (const row of rows) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }
  return counts;
}

function testActionCounts(rows) {
  const counts = { pending: 0, none: 0, logic: 0, "builder-ui": 0, "official-ui-blocked": 0 };
  for (const row of rows) {
    const action = testNormalizeAction(row.action);
    counts[action] = (counts[action] || 0) + 1;
  }
  return counts;
}

function testExpectedActionsForStatus(status) {
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
  return ["pending", "none", "logic", "builder-ui", "official-ui-blocked"];
}

function testActionMismatch(row, status) {
  const action = testNormalizeAction(row.action);
  const expectedActions = testExpectedActionsForStatus(status);
  return expectedActions.includes(action) ? null : { ...row, action, expectedActions };
}

function testEvidenceNoteMismatch(row, status) {
  if (!["match", "mismatch", "blocked"].includes(status)) {
    return null;
  }
  return testIsPendingValue(row.evidenceNote) ? { ...row, status } : null;
}

function execNodeWithoutParentCoverage(args, options = {}) {
  const childEnv = { ...process.env };
  const childCoverageDir = childEnv.NODE_V8_COVERAGE
    ? mkdtempSync(join(tmpdir(), "heretic-builder-child-coverage-"))
    : null;
  if (childCoverageDir) {
    childEnv.NODE_V8_COVERAGE = childCoverageDir;
  }
  try {
    return execFileSync(process.execPath, args, {
      encoding: "utf8",
      env: childEnv,
      maxBuffer: 128 * 1024 * 1024,
      ...options,
    });
  } finally {
    if (childCoverageDir) {
      rmSync(childCoverageDir, { recursive: true, force: true });
    }
  }
}

export {
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
};
