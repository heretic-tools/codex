import { renderAttachmentEditor } from "./builder_roster_attachment_editor_view.js";
import { renderDetachmentEditor } from "./builder_roster_detachment_editor_view.js";
import { renderUnitEditor } from "./builder_roster_unit_editor_view.js";

function renderRosterEditor({ newId, onUndoableUpdate = null, onUnitOpen, onUpdate, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-roster-editor";
  const attachmentEditor = renderAttachmentEditor({ newId, onUndoableUpdate, onUnitOpen, onUpdate, roster, validation });
  root.append(
    renderDetachmentEditor({ onUndoableUpdate, onUpdate, roster, validation }),
    renderUnitEditor({ newId, onUndoableUpdate, onUnitOpen, onUpdate, roster, validation })
  );
  if (attachmentEditor) {
    root.appendChild(attachmentEditor);
  }
  return root;
}

export { renderRosterEditor };
