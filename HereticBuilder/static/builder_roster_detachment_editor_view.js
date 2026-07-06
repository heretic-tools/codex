import {
  detachmentCandidateRows,
  detachmentCandidateStatus,
} from "./builder_roster_detachment_candidates.js";
import {
  addDetachmentFromControls,
  renderDetachmentControls,
} from "./builder_roster_detachment_controls.js";
import { renderDetachmentRow } from "./builder_roster_detachment_rows.js";
import {
  emptyMessage,
  sectionTitle,
} from "./builder_roster_editor_dom.js";

function renderDetachmentEditor({ onUndoableUpdate = null, onUpdate, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.dataset.editorTarget = "detachments";
  const current = validation.points.detachmentPoints || 0;
  const max = validation.points.detachmentLimit || "";
  root.append(sectionTitle(
    `Detachments (${(roster.detachmentIds || []).length})`,
    max ? `${current} / ${max} DP` : `${current} DP`
  ));

  const list = document.createElement("div");
  list.className = "editor-list";
  if ((roster.detachmentIds || []).length) {
    (roster.detachmentIds || []).forEach((detachmentId, index) => {
      list.appendChild(renderDetachmentRow(roster, detachmentId, index, validation, onUpdate, onUndoableUpdate));
    });
  } else {
    list.appendChild(emptyMessage("No detachments"));
  }
  root.appendChild(list);

  root.appendChild(renderDetachmentControls({ onUndoableUpdate, onUpdate, roster, validation }));
  return root;
}

export {
  addDetachmentFromControls,
  detachmentCandidateRows,
  detachmentCandidateStatus,
  renderDetachmentEditor,
};
