import { rosterUnitSummaries } from "./builder_model.js";
import {
  parseUnitOptionValue,
  unitCandidateGroups,
  unitCandidateStatus,
  unitOptionValue,
} from "./builder_roster_unit_candidates.js";
import { renderUnitControls } from "./builder_roster_unit_controls.js";
import {
  emptyMessage,
  sectionTitle,
} from "./builder_roster_editor_dom.js";
import {
  removeUnitFromRow,
  renderUnitRow,
  unitOpenLabel,
  unitSourceBadgeText,
} from "./builder_roster_unit_rows.js";

function renderUnitEditor({ newId, onUnitRemove = null, onUpdate, onUnitOpen, roster, validation }) {
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
    for (const summary of summaries) {
      list.appendChild(renderUnitRow(roster, summary, validation, onUpdate, onUnitOpen, onUnitRemove));
    }
  } else {
    list.appendChild(emptyMessage("No units"));
  }
  root.appendChild(list);

  root.appendChild(renderUnitControls({ newId, onUpdate, roster, validation }));
  return root;
}

export {
  parseUnitOptionValue,
  removeUnitFromRow,
  renderUnitEditor,
  unitCandidateGroups,
  unitCandidateStatus,
  unitOptionValue,
  unitOpenLabel,
  unitSourceBadgeText,
};
