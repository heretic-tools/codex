import { button, option } from "./builder_dom.js";
import { rosterWithAddedDetachment } from "./builder_roster_actions.js";
import {
  detachmentCandidateRows,
  detachmentCandidateStatus,
  detachmentOptionText,
} from "./builder_roster_detachment_candidates.js";
import { renderDetachmentRow } from "./builder_roster_detachment_rows.js";
import {
  emptyMessage,
  sectionTitle,
} from "./builder_roster_editor_dom.js";

function renderDetachmentEditor({ onUpdate, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.dataset.editorTarget = "detachments";
  const current = validation.points.detachmentPoints || 0;
  const max = validation.points.detachmentLimit || "";
  root.append(sectionTitle(
    `Detachments (${(roster.detachmentIds || []).length})`,
    max ? `${current} / ${max} DP` : `${current} DP`
  ));

  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search";
  search.autocomplete = "off";
  const searchWrap = document.createElement("span");
  searchWrap.className = "builder-search-field";
  const clearSearch = button("remove-button search-clear-button", "x", () => {
    search.value = "";
    refreshOptions();
    search.focus();
  });
  clearSearch.setAttribute("aria-label", "Clear search");
  searchWrap.append(search, clearSearch);
  const select = document.createElement("select");
  select.dataset.focusTarget = "true";
  const add = button("plain-button add-button", "Add", async () => {
    await onUpdate(rosterWithAddedDetachment(roster, select.value));
  });
  const refreshOptions = () => {
    const rows = detachmentCandidateRows(roster, validation, search.value);
    const nodes = rows.map((row) => (
      option(row.detachment.id, detachmentOptionText(roster, row.detachment, row.status))
    ));
    if (!nodes.length) {
      const empty = option("", search.value.trim() ? "No matching detachments" : "No detachments available");
      empty.disabled = true;
      nodes.push(empty);
    }
    select.replaceChildren(...nodes);
    add.disabled = !rows.length;
    select.disabled = !rows.length;
    clearSearch.hidden = !search.value;
  };
  search.addEventListener("input", refreshOptions);
  refreshOptions();

  const list = document.createElement("div");
  list.className = "editor-list";
  if ((roster.detachmentIds || []).length) {
    (roster.detachmentIds || []).forEach((detachmentId, index) => {
      list.appendChild(renderDetachmentRow(roster, detachmentId, index, validation, onUpdate));
    });
  } else {
    list.appendChild(emptyMessage("No detachments"));
  }
  root.appendChild(list);

  const controls = document.createElement("div");
  controls.className = "builder-control-row detachment-control-row";
  controls.append(searchWrap, select, add);
  root.appendChild(controls);
  return root;
}

export { detachmentCandidateRows, detachmentCandidateStatus, renderDetachmentEditor };
