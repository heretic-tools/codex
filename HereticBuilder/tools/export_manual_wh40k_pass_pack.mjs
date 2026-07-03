#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { extractModes } from "./manual_wh40k_pass_pack_config.mjs";
import { markdownOutput, manualPassPack } from "./manual_wh40k_pass_pack_rows.mjs";
import {
  actionBacklogBlockingFailures,
  checkPassPackResults,
  extractResults,
  markdownNextActionOutput,
  markdownStatusOutput,
  mergeMinimumSubcheckBatchIntoPassPack,
  mergeNextBatchIntoPassPack,
  minimumSubcheckBatchCheckSummary,
  nextActionSummary,
  nextBatchCheckSummary,
  passPackStatus,
  runbookOutput,
} from "./manual_wh40k_pass_pack_results.mjs";

function usage() {
  return [
    "Usage: node export_manual_wh40k_pass_pack.mjs [--format json|markdown|runbook]",
    "       node export_manual_wh40k_pass_pack.mjs --check-results pass-pack.md [--allow-pending]",
    "       node export_manual_wh40k_pass_pack.mjs --check-batch next-batch.md --from pass-pack.md [--allow-pending]",
    "       node export_manual_wh40k_pass_pack.mjs --check-subcheck-batch subcheck-batch.md --from pass-pack.md [--allow-pending]",
    "       node export_manual_wh40k_pass_pack.mjs --merge-subcheck-batch subcheck-batch.md --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --next-action --from pass-pack.md [--format json|markdown]",
    "       node export_manual_wh40k_pass_pack.mjs --status --from pass-pack.md [--format json|markdown]",
    "       node export_manual_wh40k_pass_pack.mjs --extract action-backlog --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --extract minimum-checklist --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --extract minimum-subcheck-batch --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --extract next-pending-batch --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --extract wargear-results --from pass-pack.md",
    "       node export_manual_wh40k_pass_pack.mjs --merge-batch next-batch.md --from pass-pack.md",
    "",
    "Exports the current manual WH app pass pack:",
    "- 17 minimum parity UI/golden-case rows still allowed to remain pending",
    "- 43 minimum UI subchecks as a fillable batch worksheet",
    "- 26 wargear UI setup rows from the executable wargear manifest",
    "--check-results validates a filled pass-pack markdown file against both sections.",
    "--check-subcheck-batch validates the current minimum UI batch at subcheck granularity.",
    "--merge-subcheck-batch emits a pass-pack candidate from a filled minimum subcheck batch.",
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
    checkSubcheckBatchPath: "",
    extractFromPath: "",
    extractMode: "",
    format: "json",
    mergeBatchPath: "",
    mergeSubcheckBatchPath: "",
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
    if (arg === "--check-subcheck-batch") {
      result.checkSubcheckBatchPath = argv[index + 1] || "";
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
    if (arg === "--merge-subcheck-batch") {
      result.mergeSubcheckBatchPath = argv[index + 1] || "";
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
  if (argv.includes("--check-subcheck-batch") && !result.checkSubcheckBatchPath) {
    throw new Error("--check-subcheck-batch requires a subcheck-batch markdown file path");
  }
  if (result.extractMode && !extractModes.includes(result.extractMode)) {
    throw new Error(`Unsupported extract mode: ${result.extractMode}`);
  }
  if (result.extractMode && result.statusMode) {
    throw new Error("--status cannot be combined with --extract");
  }
  if (result.nextActionMode && (result.extractMode || result.statusMode || result.checkResultsPath || result.checkBatchPath || result.checkSubcheckBatchPath || result.mergeBatchPath || result.mergeSubcheckBatchPath)) {
    throw new Error("--next-action cannot be combined with --extract, --status, --check-results, --check-batch, --check-subcheck-batch, --merge-batch, or --merge-subcheck-batch");
  }
  if (result.checkBatchPath && (result.extractMode || result.statusMode || result.checkResultsPath || result.mergeBatchPath || result.mergeSubcheckBatchPath)) {
    throw new Error("--check-batch cannot be combined with --extract, --status, --check-results, --merge-batch, or --merge-subcheck-batch");
  }
  if (result.checkSubcheckBatchPath && (result.extractMode || result.statusMode || result.checkResultsPath || result.checkBatchPath || result.mergeBatchPath || result.mergeSubcheckBatchPath)) {
    throw new Error("--check-subcheck-batch cannot be combined with --extract, --status, --check-results, --check-batch, --merge-batch, or --merge-subcheck-batch");
  }
  if (result.mergeBatchPath && (result.extractMode || result.statusMode || result.checkResultsPath || result.checkBatchPath || result.mergeSubcheckBatchPath)) {
    throw new Error("--merge-batch cannot be combined with --extract, --status, --check-results, --check-batch, or --merge-subcheck-batch");
  }
  if (result.mergeSubcheckBatchPath && (result.extractMode || result.statusMode || result.checkResultsPath || result.checkBatchPath || result.checkSubcheckBatchPath || result.mergeBatchPath)) {
    throw new Error("--merge-subcheck-batch cannot be combined with --extract, --status, --check-results, --check-batch, --check-subcheck-batch, or --merge-batch");
  }
  if (result.extractMode && !result.extractFromPath) {
    throw new Error("--extract requires --from pass-pack.md");
  }
  if (argv.includes("--merge-batch") && !result.mergeBatchPath) {
    throw new Error("--merge-batch requires a next-batch markdown file path");
  }
  if (argv.includes("--merge-subcheck-batch") && !result.mergeSubcheckBatchPath) {
    throw new Error("--merge-subcheck-batch requires a subcheck-batch markdown file path");
  }
  if (result.mergeBatchPath && !result.extractFromPath) {
    throw new Error("--merge-batch requires --from pass-pack.md");
  }
  if (result.mergeSubcheckBatchPath && !result.extractFromPath) {
    throw new Error("--merge-subcheck-batch requires --from pass-pack.md");
  }
  if (result.checkBatchPath && !result.extractFromPath) {
    throw new Error("--check-batch requires --from pass-pack.md");
  }
  if (result.checkSubcheckBatchPath && !result.extractFromPath) {
    throw new Error("--check-subcheck-batch requires --from pass-pack.md");
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
  if (result.extractFromPath && !result.extractMode && !result.statusMode && !result.mergeBatchPath && !result.mergeSubcheckBatchPath && !result.checkBatchPath && !result.checkSubcheckBatchPath && !result.nextActionMode) {
    throw new Error("--from requires --extract action-backlog|minimum-checklist|minimum-subcheck-batch|next-pending-batch|wargear-results, --merge-subcheck-batch, or --status");
  }
  return result;
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
} else if (args.checkSubcheckBatchPath) {
  const summary = minimumSubcheckBatchCheckSummary(
    pack,
    readFileSync(args.extractFromPath, "utf8"),
    readFileSync(args.checkSubcheckBatchPath, "utf8"),
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
} else if (args.mergeSubcheckBatchPath) {
  let mergedMarkdown = "";
  try {
    mergedMarkdown = mergeMinimumSubcheckBatchIntoPassPack(
      pack,
      readFileSync(args.extractFromPath, "utf8"),
      readFileSync(args.mergeSubcheckBatchPath, "utf8"),
    );
  } catch (error) {
    console.log(JSON.stringify({ error: error.message }, null, 2));
    process.exit(1);
  }
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
