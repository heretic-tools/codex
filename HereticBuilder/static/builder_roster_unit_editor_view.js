import { rosterUnitSummaries } from "./builder_model.js";
import {
  parseUnitOptionValue,
  unitCandidateGroups,
  unitCandidateStatus,
  unitOptionValue,
} from "./builder_roster_unit_candidates.js";
import {
  addUnitFromControls,
  renderUnitControls,
} from "./builder_roster_unit_controls.js";
import {
  emptyMessage,
  sectionTitle,
} from "./builder_roster_editor_dom.js";
import {
  removeUnitFromRow,
  renderUnitRow,
  unitModelCountLabel,
  unitOpenLabel,
  unitSourceBadgeText,
} from "./builder_roster_unit_rows.js";

const UNIT_SUMMARY_GROUPS = [
  "Character",
  "Battleline",
  "Dedicated Transport",
  "Other",
];

function unitSummaryHasKeyword(summary, keywordName) {
  const target = String(keywordName || "").toLowerCase();
  return (summary.keywordNames || []).some((name) => String(name || "").toLowerCase() === target);
}

function unitSummaryGroupLabel(summary) {
  if (unitSummaryHasKeyword(summary, "Character")) {
    return "Character";
  }
  if (unitSummaryHasKeyword(summary, "Battleline")) {
    return "Battleline";
  }
  if (unitSummaryHasKeyword(summary, "Dedicated Transport")) {
    return "Dedicated Transport";
  }
  return "Other";
}

function unitSummaryGroups(summaries) {
  const byLabel = new Map(UNIT_SUMMARY_GROUPS.map((label) => [label, []]));
  for (const summary of summaries || []) {
    byLabel.get(unitSummaryGroupLabel(summary)).push(summary);
  }
  return UNIT_SUMMARY_GROUPS
    .map((label) => ({ label, rows: byLabel.get(label) || [] }))
    .filter((group) => group.rows.length);
}

function unitGroupHeading(group) {
  return textNode("div", "editor-group-heading", `${group.label} (${group.rows.length})`);
}

function renderUnitEditor({ newId, onUndoableUpdate = null, onUpdate, onUnitOpen, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.dataset.editorTarget = "units";
  root.append(sectionTitle(
    `Units (${(roster.units || []).length})`,
    `${validation.points.total} / ${validation.points.limit} pts`
  ));

  const list = document.createElement("div");
  list.className = "editor-list";
  const summaries = rosterUnitSummaries(roster);
  if (summaries.length) {
    for (const group of unitSummaryGroups(summaries)) {
      list.appendChild(unitGroupHeading(group));
      for (const summary of group.rows) {
        list.appendChild(renderUnitRow(roster, summary, validation, onUpdate, onUnitOpen, onUndoableUpdate));
      }
    }
  } else {
    list.appendChild(emptyMessage("No units"));
  }
  root.appendChild(list);

  root.appendChild(renderUnitControls({ newId, onUndoableUpdate, onUpdate, roster, validation }));
  return root;
}

export {
  parseUnitOptionValue,
  addUnitFromControls,
  removeUnitFromRow,
  renderUnitEditor,
  unitCandidateGroups,
  unitCandidateStatus,
  unitSummaryGroupLabel,
  unitSummaryGroups,
  unitModelCountLabel,
  unitOptionValue,
  unitOpenLabel,
  unitSourceBadgeText,
};
