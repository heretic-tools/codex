import { button, metricLine, option, textNode } from "./builder_dom.js";
import {
  availableCompositions,
  compositionFactionIds,
  compositionLabel,
  unitSummary,
} from "./builder_model.js";
import {
  rosterWithUnitComposition,
  rosterWithUnitWargearCount,
} from "./builder_roster_actions.js";
import { state } from "./builder_state.js";

function unitDisplayName(roster, unit) {
  return unitSummary(roster, unit).name || "Unit";
}

function wargearOptionName(row) {
  const item = state.catalog.wargearItemById.get(row.wargearItemId);
  const points = row.points ? ` / ${row.points} pts` : "";
  return `${item?.name || "Wargear"}${points}`;
}

function currentCount(target, optionId) {
  return Number((target.wargear || {})[optionId] || 0);
}

function countControl({ onChange, optionRow, target }) {
  if (optionRow.inputType === "checkbox") {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = currentCount(target, optionRow.id) > 0;
    input.addEventListener("change", () => onChange(input.checked ? 1 : 0));
    return input;
  }
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = String(currentCount(target, optionRow.id));
  input.addEventListener("change", () => onChange(input.value));
  return input;
}

function renderWargearOption({ group, onUpdate, optionRow, roster, target, unit }) {
  const row = document.createElement("label");
  row.className = "wargear-option-row";
  row.append(textNode("span", "", wargearOptionName(optionRow)));
  row.appendChild(countControl({
    optionRow,
    target,
    onChange: async (count) => onUpdate(rosterWithUnitWargearCount(roster, unit.id, {
      count,
      optionId: optionRow.id,
      rosterUnitMiniatureId: target.rosterUnitMiniatureId || "",
    })),
  }));
  if (group.instructionText) {
    row.title = group.instructionText;
  }
  return row;
}

function renderWargearGroup({ group, onUpdate, roster, target, unit }) {
  const rows = state.catalog.wargearOptionsByGroupId.get(group.id) || [];
  const wrap = document.createElement("div");
  wrap.className = "wargear-group";
  wrap.appendChild(textNode("h3", "wargear-group-title", group.instructionText || "Wargear"));
  for (const optionRow of rows) {
    wrap.appendChild(renderWargearOption({ group, onUpdate, optionRow, roster, target, unit }));
  }
  return wrap;
}

function groupsFor(unit, miniatureId = "") {
  return (state.catalog.wargearGroupsByDatasheetId.get(unit.datasheetId) || [])
    .filter((group) => (group.miniatureId || "") === miniatureId)
    .sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0));
}

function renderScope({ groups, heading, onUpdate, roster, target, unit }) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section wargear-scope";
  wrap.appendChild(textNode("h2", "section-title", heading));
  if (!groups.length) {
    wrap.appendChild(textNode("p", "empty-list", "No wargear options"));
    return wrap;
  }
  for (const group of groups) {
    wrap.appendChild(renderWargearGroup({ group, onUpdate, roster, target, unit }));
  }
  return wrap;
}

function renderCompositionEditor({ onUpdate, roster, unit }) {
  const factionIds = compositionFactionIds(roster, unit.allyType || "native");
  const compositions = availableCompositions(unit.datasheetId, factionIds, roster.detachmentIds || []);
  const select = document.createElement("select");
  for (const row of compositions) {
    select.appendChild(option(row.id, `${compositionLabel(row)} (${row.points || 0} pts)`));
  }
  select.value = unit.compositionId || compositions[0]?.id || "";
  select.addEventListener("change", async () => {
    await onUpdate(rosterWithUnitComposition(roster, unit.id, select.value));
  });
  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.append(textNode("span", "", "Composition"), select);
  return wrap;
}

function renderRosterUnitDetailView({ onBack, onUpdate, roster, unit }) {
  const summary = unitSummary(roster, unit);
  const root = document.createElement("section");
  root.className = "builder-grid";

  const overview = document.createElement("section");
  overview.className = "builder-section";
  overview.append(
    textNode("h2", "section-title", summary.name),
    metricLine("Points", String(summary.points || 0)),
    metricLine("Models", String(summary.modelCount || 0)),
    renderCompositionEditor({ onUpdate, roster, unit: summary }),
    button("plain-button", "Back", onBack)
  );

  const wargear = document.createElement("section");
  wargear.className = "builder-section unit-wargear-section";
  wargear.appendChild(renderScope({
    groups: groupsFor(summary),
    heading: "Unit Wargear",
    onUpdate,
    roster,
    target: summary,
    unit: summary,
  }));
  for (const miniature of summary.miniatures) {
    wargear.appendChild(renderScope({
      groups: groupsFor(summary, miniature.miniatureId),
      heading: `${miniature.name} (${miniature.count || 0})`,
      onUpdate,
      roster,
      target: miniature,
      unit: summary,
    }));
  }

  root.append(overview, wargear);
  return root;
}

export { renderRosterUnitDetailView, unitDisplayName };
