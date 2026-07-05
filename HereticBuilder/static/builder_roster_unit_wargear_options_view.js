import { textNode } from "./builder_dom.js";
import { rosterWithUnitWargearCount } from "./builder_roster_actions.js";
import { state } from "./builder_state.js";

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
    input.dataset.focusTarget = "true";
    input.addEventListener("change", () => onChange(input.checked ? 1 : 0));
    return input;
  }
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = String(currentCount(target, optionRow.id));
  input.dataset.focusTarget = "true";
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

export { renderWargearGroup };
