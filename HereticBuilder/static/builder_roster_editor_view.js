import { renderAttachmentEditor } from "./builder_roster_attachment_editor_view.js";
import { renderDetachmentEditor } from "./builder_roster_detachment_editor_view.js";
import { renderUnitEditor } from "./builder_roster_unit_editor_view.js";

function renderRosterEditor({ newId, onUnitOpen, onUpdate, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.append(
    renderDetachmentEditor({ onUpdate, roster, validation }),
    renderUnitEditor({ newId, onUnitOpen, onUpdate, roster, validation }),
    renderAttachmentEditor({ newId, onUnitOpen, onUpdate, roster, validation })
  );
  return root;
}

export { renderRosterEditor };
