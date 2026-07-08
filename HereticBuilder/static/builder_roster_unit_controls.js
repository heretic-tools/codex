import { button } from "./builder_dom.js";
import { addOptionsStatus } from "./builder_roster_add_options_status.js";
import {
  ADD_UNIT_LABEL,
  SEARCH_CLEAR_LABEL,
  UNIT_SELECT_LABEL,
  labelControl,
  searchControlLabel,
} from "./builder_roster_control_labels.js";
import { rosterWithAddedUnit } from "./builder_roster_actions.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import {
  parseUnitOptionValue,
} from "./builder_roster_unit_candidates.js";
import { ensurePrecomputedLoadoutsForDatasheets } from "./builder_precomputed_loadouts_runtime.js";
import { refreshUnitControlOptions } from "./builder_roster_unit_control_options.js";

function addedUnitMessage(label) {
  return `${label || "Unit"} added`;
}

function addUnitFromControls({ label = "", onUndoableUpdate = null, onUpdate, roster, selected, unitId }) {
  return applyRosterUpdate({
    message: addedUnitMessage(label),
    nextRoster: rosterWithAddedUnit(roster, {
      allyType: selected.allyType,
      datasheetId: selected.datasheetId,
      unitId,
    }),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function renderUnitControls({ newId, onUndoableUpdate = null, onUpdate, roster, validation }) {
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search";
  search.autocomplete = "off";
  labelControl(search, searchControlLabel("units"));
  search.dataset.focusTarget = "true";
  const searchWrap = document.createElement("span");
  searchWrap.className = "builder-search-field";
  const unitSelect = document.createElement("select");
  labelControl(unitSelect, UNIT_SELECT_LABEL);
  const status = document.createElement("span");
  status.className = "field-status add-options-status unit-add-options-status";
  status.id = "unit-add-options-status";
  unitSelect.setAttribute("aria-describedby", status.id);
  const add = button("plain-button add-button", "Add", async () => {
    const selected = parseUnitOptionValue(unitSelect.value);
    const label = unitSelect.selectedOptions?.[0]?.textContent || "";
    await ensurePrecomputedLoadoutsForDatasheets([selected.datasheetId]);
    await addUnitFromControls({
      label,
      onUndoableUpdate,
      onUpdate,
      roster,
      selected,
      unitId: newId(),
    });
  });
  labelControl(add, ADD_UNIT_LABEL);
  add.dataset.editorPrimaryAction = "true";
  const refreshOptions = () => {
    const groups = refreshUnitControlOptions({ add, clearSearch, roster, search, unitSelect, validation });
    status.textContent = addOptionsStatus(groups, {
      emptyText: "No units available",
      lockedText: "locked",
      optionText: "available",
      searchText: "No matching units",
      searched: Boolean(search.value.trim()),
    });
  };
  const clearSearchValue = () => {
    if (!search.value) {
      return false;
    }
    search.value = "";
    refreshOptions();
    return true;
  };
  const clearSearch = button("remove-button search-clear-button", "x", () => {
    clearSearchValue();
    search.focus();
  });
  labelControl(clearSearch, SEARCH_CLEAR_LABEL);
  searchWrap.append(search, clearSearch);
  search.addEventListener("input", refreshOptions);
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && clearSearchValue()) {
      event.preventDefault?.();
      event.stopPropagation?.();
    }
  });
  refreshOptions();

  const controls = document.createElement("div");
  controls.className = "builder-control-row unit-control-row";
  controls.append(searchWrap, unitSelect, add, status);
  return controls;
}

export { addUnitFromControls, addedUnitMessage, renderUnitControls };
