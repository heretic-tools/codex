import { rosterUnitSummaries } from "./builder_model.js";
import {
  attachmentUnavailableMessage,
  bodyguardRows,
} from "./builder_roster_attachment_options.js";
import { renderAttachmentControls } from "./builder_roster_attachment_controls.js";
import { renderAttachmentRow } from "./builder_roster_attachment_rows.js";
import {
  emptyMessage,
  sectionTitle,
} from "./builder_roster_editor_dom.js";

function renderAttachmentEditor({ newId, onUnitOpen, onUpdate, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.dataset.editorTarget = "attachments";
  root.append(sectionTitle(`Attached Units (${(roster.attachments || []).length})`));

  const units = rosterUnitSummaries(roster);
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const bodyguards = bodyguardRows(roster, units);

  const list = document.createElement("div");
  list.className = "editor-list";
  if ((roster.attachments || []).length) {
    (roster.attachments || []).forEach((attachment, index) => {
      list.appendChild(renderAttachmentRow(roster, attachment, index, unitsById, validation, onUpdate, onUnitOpen));
    });
  } else {
    list.appendChild(emptyMessage(attachmentUnavailableMessage(roster, units, bodyguards)));
  }
  root.appendChild(list);

  root.appendChild(renderAttachmentControls({ bodyguards, newId, onUpdate, roster, units, unitsById }));
  return root;
}

export { attachmentUnavailableMessage, renderAttachmentEditor };
