import { button, option, textNode } from "./builder_dom.js";
import {
  availableDatasheets,
  availableUnitSources,
  compositionFactionIds,
  defaultComposition,
  rosterUnitSummaries,
} from "./builder_model.js";
import {
  rosterWithAddedUnit,
  rosterWithRemovedUnit,
} from "./builder_roster_actions.js";
import {
  emptyMessage,
  removeButton,
  sectionTitle,
} from "./builder_roster_editor_dom.js";

function unitOptionLabel(roster, allyType, datasheet) {
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []);
  const points = composition ? `${composition.points || 0} pts` : "no composition";
  return `${datasheet.name} (${points})`;
}

function renderUnitRow(roster, summary, onUpdate, onUnitOpen) {
  const row = document.createElement("div");
  row.className = "builder-row editor-row unit-editor-row";
  const text = button("unit-open-button", "", () => onUnitOpen(summary));
  text.className = "unit-open-button row-text";
  text.append(
    textNode("strong", "", summary.name || "Unit"),
    textNode("span", "", `${summary.modelCount || 0} models`)
  );
  if ((summary.allyType || "native") !== "native") {
    text.append(textNode("span", "meta-badge", "Allied"));
  }
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", "", `${summary.points || 0} pts`),
    removeButton("Remove unit", async () => onUpdate(rosterWithRemovedUnit(roster, summary.id)))
  );
  row.append(text, meta);
  return row;
}

function renderUnitEditor({ newId, onUpdate, onUnitOpen, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.append(sectionTitle(
    `Units (${(roster.units || []).length})`,
    `${validation.points.total} / ${validation.points.limit} pts`
  ));

  const source = document.createElement("select");
  for (const item of availableUnitSources(roster)) {
    source.appendChild(option(item.value, item.label));
  }
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search";
  search.autocomplete = "off";
  const unitSelect = document.createElement("select");
  const add = button("plain-button add-button", "Add", async () => {
    await onUpdate(rosterWithAddedUnit(roster, {
      allyType: source.value,
      datasheetId: unitSelect.value,
      unitId: newId(),
    }));
  });
  const refreshOptions = () => {
    const query = search.value.trim().toLocaleLowerCase();
    const rows = availableDatasheets(roster, source.value)
      .filter((datasheet) => !query || String(datasheet.name || "").toLocaleLowerCase().includes(query));
    unitSelect.replaceChildren(...rows.map((datasheet) => option(datasheet.id, unitOptionLabel(roster, source.value, datasheet))));
    add.disabled = !rows.length;
  };
  source.addEventListener("change", refreshOptions);
  search.addEventListener("input", refreshOptions);
  refreshOptions();

  const controls = document.createElement("div");
  controls.className = "builder-control-row unit-control-row";
  controls.append(source, search, unitSelect, add);
  root.appendChild(controls);

  const list = document.createElement("div");
  list.className = "editor-list";
  const summaries = rosterUnitSummaries(roster);
  if (summaries.length) {
    for (const summary of summaries) {
      list.appendChild(renderUnitRow(roster, summary, onUpdate, onUnitOpen));
    }
  } else {
    list.appendChild(emptyMessage("No units"));
  }
  root.appendChild(list);
  return root;
}

export { renderUnitEditor };
