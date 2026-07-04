import { button, option, textNode } from "./builder_dom.js";
import {
  availableDetachments,
  costForDetachment,
  detachmentDispositionName,
} from "./builder_model.js";
import {
  rosterWithAddedDetachment,
  rosterWithRemovedDetachment,
} from "./builder_roster_actions.js";
import {
  dispositionSlug,
  emptyMessage,
  removeButton,
  sectionTitle,
} from "./builder_roster_editor_dom.js";

function detachmentOptionLabel(roster, detachment) {
  const disposition = detachmentDispositionName(detachment) || "No disposition";
  return `${detachment.name} (${disposition} / ${costForDetachment(detachment.id, roster.factionKeywordId)} DP)`;
}

function renderDetachmentRow(roster, detachmentId, index, onUpdate) {
  const detachment = availableDetachments(roster.factionKeywordId)
    .find((item) => item.id === detachmentId);
  const row = document.createElement("div");
  row.className = "builder-row editor-row";
  const text = document.createElement("span");
  text.className = "row-text";
  text.append(textNode("strong", "", detachment?.name || "Unknown Detachment"));
  const disposition = detachment ? detachmentDispositionName(detachment) : "";
  if (disposition) {
    text.append(textNode("span", `disposition-badge disposition-${dispositionSlug(disposition)}`, disposition));
  }
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", "", `${detachment ? costForDetachment(detachment.id, roster.factionKeywordId) : 0} DP`),
    removeButton("Remove detachment", async () => onUpdate(rosterWithRemovedDetachment(roster, index)))
  );
  row.append(text, meta);
  return row;
}

function renderDetachmentEditor({ onUpdate, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  const current = validation.points.detachmentPoints || 0;
  const max = validation.points.detachmentLimit || "";
  root.append(sectionTitle(
    `Detachments (${(roster.detachmentIds || []).length})`,
    max ? `${current} / ${max} DP` : `${current} DP`
  ));

  const available = availableDetachments(roster.factionKeywordId)
    .filter((detachment) => !(roster.detachmentIds || []).includes(detachment.id));
  const select = document.createElement("select");
  for (const detachment of available) {
    select.appendChild(option(detachment.id, detachmentOptionLabel(roster, detachment)));
  }
  const add = button("plain-button add-button", "Add", async () => {
    await onUpdate(rosterWithAddedDetachment(roster, select.value));
  });
  add.disabled = !available.length;
  const controls = document.createElement("div");
  controls.className = "builder-control-row";
  controls.append(select, add);
  root.appendChild(controls);

  const list = document.createElement("div");
  list.className = "editor-list";
  if ((roster.detachmentIds || []).length) {
    (roster.detachmentIds || []).forEach((detachmentId, index) => {
      list.appendChild(renderDetachmentRow(roster, detachmentId, index, onUpdate));
    });
  } else {
    list.appendChild(emptyMessage("No detachments"));
  }
  root.appendChild(list);
  return root;
}

export { renderDetachmentEditor };
