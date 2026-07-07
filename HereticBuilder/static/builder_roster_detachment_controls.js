import { button, option } from "./builder_dom.js";
import { rosterWithAddedDetachment } from "./builder_roster_actions.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import {
  detachmentCandidateRows,
  detachmentOptionText,
} from "./builder_roster_detachment_candidates.js";
import {
  ADD_DETACHMENT_LABEL,
  DETACHMENT_SELECT_LABEL,
  SEARCH_CLEAR_LABEL,
  labelControl,
  searchControlLabel,
} from "./builder_roster_control_labels.js";

function addedDetachmentMessage(label) {
  return `${label || "Detachment"} added`;
}

function addDetachmentFromControls(roster, detachmentId, label, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: addedDetachmentMessage(label),
    nextRoster: rosterWithAddedDetachment(roster, detachmentId),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function renderDetachmentControls({ onUndoableUpdate = null, onUpdate, roster, validation }) {
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search";
  search.autocomplete = "off";
  labelControl(search, searchControlLabel("detachments"));
  search.dataset.focusTarget = "true";
  const searchWrap = document.createElement("span");
  searchWrap.className = "builder-search-field";
  const clearSearch = button("remove-button search-clear-button", "x", () => {
    clearSearchValue();
    search.focus();
  });
  labelControl(clearSearch, SEARCH_CLEAR_LABEL);
  searchWrap.append(search, clearSearch);
  const select = document.createElement("select");
  select.dataset.focusTarget = "true";
  labelControl(select, DETACHMENT_SELECT_LABEL);
  const add = button("plain-button add-button", "Add", async () => {
    await addDetachmentFromControls(
      roster,
      select.value,
      select.selectedOptions?.[0]?.textContent || "",
      onUpdate,
      onUndoableUpdate
    );
  });
  labelControl(add, ADD_DETACHMENT_LABEL);
  add.dataset.editorPrimaryAction = "true";
  const clearSearchValue = () => {
    if (!search.value) {
      return false;
    }
    search.value = "";
    refreshOptions();
    return true;
  };
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
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && clearSearchValue()) {
      event.preventDefault?.();
      event.stopPropagation?.();
    }
  });
  refreshOptions();

  const controls = document.createElement("div");
  controls.className = "builder-control-row detachment-control-row";
  controls.append(searchWrap, select, add);
  return controls;
}

export { addDetachmentFromControls, addedDetachmentMessage, renderDetachmentControls };
