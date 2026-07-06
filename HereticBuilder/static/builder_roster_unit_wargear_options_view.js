import { textNode } from "./builder_dom.js";
import { rosterWithUnitWargearCount } from "./builder_roster_actions.js";
import { countControl } from "./builder_roster_unit_wargear_count_control.js";
import { wargearOptionRowsForGroup } from "./builder_roster_unit_wargear_options.js";

function renderWargearOption({ group, label, onUpdate, optionRow, roster, target, unit }) {
  const row = document.createElement("label");
  row.className = "wargear-option-row";
  row.append(textNode("span", "", label));
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
  const wrap = document.createElement("div");
  wrap.className = "wargear-group";
  wrap.appendChild(textNode("h3", "wargear-group-title", group.instructionText || "Wargear"));
  for (const row of wargearOptionRowsForGroup(group)) {
    wrap.appendChild(renderWargearOption({
      group,
      label: row.label,
      onUpdate,
      optionRow: row.optionRow,
      roster,
      target,
      unit,
    }));
  }
  return wrap;
}

export { renderWargearGroup };
