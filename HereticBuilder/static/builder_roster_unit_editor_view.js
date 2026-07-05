import { button, option } from "./builder_dom.js";
import { rosterUnitSummaries } from "./builder_model.js";
import { rosterWithAddedUnit } from "./builder_roster_actions.js";
import {
  parseUnitOptionValue,
  unitCandidateGroups,
  unitCandidateStatus,
  unitOptionText,
  unitOptionValue,
} from "./builder_roster_unit_candidates.js";
import {
  emptyMessage,
  sectionTitle,
} from "./builder_roster_editor_dom.js";
import { renderUnitRow, unitSourceBadgeText } from "./builder_roster_unit_rows.js";

function renderUnitEditor({ newId, onUpdate, onUnitOpen, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.dataset.editorTarget = "units";
  root.append(sectionTitle(
    `Units (${(roster.units || []).length})`,
    `${validation.points.total} / ${validation.points.limit} pts`
  ));

  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search";
  search.autocomplete = "off";
  search.dataset.focusTarget = "true";
  const searchWrap = document.createElement("span");
  searchWrap.className = "builder-search-field";
  const clearSearch = button("remove-button search-clear-button", "x", () => {
    search.value = "";
    refreshOptions();
    search.focus();
  });
  clearSearch.setAttribute("aria-label", "Clear search");
  searchWrap.append(search, clearSearch);
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
  search.addEventListener("input", refreshOptions);
  refreshOptions();

  const list = document.createElement("div");
  list.className = "editor-list";
  const summaries = rosterUnitSummaries(roster);
  if (summaries.length) {
    for (const summary of summaries) {
      list.appendChild(renderUnitRow(roster, summary, validation, onUpdate, onUnitOpen));
    }
  } else {
    list.appendChild(emptyMessage("No units"));
  }
  root.appendChild(list);

  const controls = document.createElement("div");
  controls.className = "builder-control-row unit-control-row";
  controls.append(searchWrap, unitSelect, add);
  root.appendChild(controls);
  return root;
}

export {
  parseUnitOptionValue,
  renderUnitEditor,
  unitCandidateGroups,
  unitCandidateStatus,
  unitOptionValue,
  unitSourceBadgeText,
};
