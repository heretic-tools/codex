import { button } from "./builder_dom.js";
import { rosterWithAddedUnit } from "./builder_roster_actions.js";
import {
  parseUnitOptionValue,
} from "./builder_roster_unit_candidates.js";
import { refreshUnitControlOptions } from "./builder_roster_unit_control_options.js";

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
    refreshUnitControlOptions({ add, clearSearch, roster, search, unitSelect, validation });
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
