import { button, option } from "./builder_dom.js";
import { rosterWithAddedUnit } from "./builder_roster_actions.js";
import {
  parseUnitOptionValue,
  unitCandidateGroups,
  unitOptionText,
  unitOptionValue,
} from "./builder_roster_unit_candidates.js";

function renderUnitControls({ newId, onUpdate, roster, validation }) {
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search";
  search.autocomplete = "off";
  search.dataset.focusTarget = "true";
  const searchWrap = document.createElement("span");
  searchWrap.className = "builder-search-field";
  const unitSelect = document.createElement("select");
  const add = button("plain-button add-button", "Add", async () => {
    const selected = parseUnitOptionValue(unitSelect.value);
    await onUpdate(rosterWithAddedUnit(roster, {
      allyType: selected.allyType,
      datasheetId: selected.datasheetId,
      unitId: newId(),
    }));
  });
  const refreshOptions = () => {
    const groups = unitCandidateGroups(roster, validation, search.value);
    const nodes = groups.map((group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.source.label;
      optgroup.replaceChildren(...group.rows.map((row) => option(
        unitOptionValue(row.allyType, row.datasheet.id),
        unitOptionText(roster, row.allyType, row.datasheet, row.status)
      )));
      return optgroup;
    });
    if (!nodes.length) {
      const empty = option("", search.value.trim() ? "No matching units" : "No units available");
      empty.disabled = true;
      nodes.push(empty);
    }
    unitSelect.replaceChildren(...nodes);
    add.disabled = !groups.length;
    unitSelect.disabled = !groups.length;
    clearSearch.hidden = !search.value;
  };
  const clearSearch = button("remove-button search-clear-button", "x", () => {
    search.value = "";
    refreshOptions();
    search.focus();
  });
  clearSearch.setAttribute("aria-label", "Clear search");
  searchWrap.append(search, clearSearch);
  search.addEventListener("input", refreshOptions);
  refreshOptions();

  const controls = document.createElement("div");
  controls.className = "builder-control-row unit-control-row";
  controls.append(searchWrap, unitSelect, add);
  return controls;
}

export { renderUnitControls };
