import { readFileSync } from "node:fs";

import {
  manualMinimumParityCaseIds,
  minimumParityCases,
  minimumParityConceptByCode,
} from "../../tests/builder_validation_minimum_parity_manifest.test.mjs";
import { wargearParityManifest } from "../../tests/builder_validation_wargear_parity_cases.test.mjs";
import {
  builderExpectation,
  conceptList,
  conceptsForCodes,
  setupHintsForMinimumCase,
  subcheckList,
  subchecksForMinimumCase,
} from "./manual_wh40k_pass_pack_expectations.mjs";
import { checklistPath } from "./manual_wh40k_pass_pack_config.mjs";
import { markdownCell, parseMinimumChecklistRows, unitWargearSummary } from "./manual_wh40k_pass_pack_markdown.mjs";

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
      concepts: conceptsForCodes(parityCase.codes, minimumParityConceptByCode),
      setupHints: setupHintsForMinimumCase(caseId),
      subchecks: subchecksForMinimumCase(caseId),
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
        concepts: conceptsForCodes(parityCase.expectedCodes, minimumParityConceptByCode),
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

function manualPassPack() {
  const wargearManifest = wargearParityManifest();
  const minimumRows = manualMinimumRows();
  const wargearSetupRows = wargearRows(wargearManifest);
  return {
    dataVersion: wargearManifest.dataVersion,
    minimumManualCaseCount: minimumRows.length,
    minimumManualSubcheckCount: minimumRows.reduce((total, row) => total + row.subchecks.length, 0),
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
    `Minimum manual subchecks: ${pack.minimumManualSubcheckCount}`,
    `Wargear UI setups: ${pack.wargearSetupCount}`,
    "",
    "Validation commands:",
    "",
    "```bash",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-results docs/wh40k_app_manual_pass_pack.md --allow-pending",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --status --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_status.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --next-action --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_next_action.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract next-pending-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_next_batch.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract minimum-subcheck-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_minimum_subcheck_batch.md",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-subcheck-batch docs/wh40k_app_manual_minimum_subcheck_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending",
    "node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --merge-subcheck-batch docs/wh40k_app_manual_minimum_subcheck_batch.md --from docs/wh40k_app_manual_pass_pack.md > updated-pass-pack.md",
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
    "| # | Case id | Builder test | Codes | WH app scenario | WH app result | Parity | Action | Evidence note | Builder expectation | Official concepts | Subchecks |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
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
      "Pending",
      markdownCell(builderExpectation(row.codes)),
      markdownCell(conceptList(row.codes, minimumParityConceptByCode)),
      markdownCell(subcheckList(row.subchecks)),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  });

  lines.push(
    "",
    "## Wargear UI Cases",
    "",
    "| # | Case id | Expected | Codes | Roster faction | Detachment | Unit | Wargear setup | WH app state | WH app diagnostic | Parity | Action | Evidence note | Builder expectation | Official concepts |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
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
      "Pending",
      markdownCell(builderExpectation(row.codes, row.expectedState)),
      markdownCell(conceptList(row.codes, minimumParityConceptByCode)),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  });

  lines.push(
    "",
    "## Completion Rule",
    "",
    "Do not mark a row `match` until the official WH 40K app UI and Builder agree on valid/invalid state and diagnostic family. Use `mismatch` for a proven difference and `blocked` only when a UI cannot express the setup.",
    "",
    "`Evidence note` may stay `Pending` only while the row is pending. For `match`, `mismatch`, or `blocked`, record the concrete WH app observation that justifies the parity/action choice.",
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

export {
  manualMinimumRows,
  wargearRows,
  manualPassPack,
  markdownOutput,
};
