import { textNode } from "./builder_dom.js";
import { rosterWithUnitWargearCount } from "./builder_roster_actions.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { countControl } from "./builder_roster_unit_wargear_count_control.js";
import { wargearOptionRowsForGroup } from "./builder_roster_unit_wargear_options.js";

function wargearChangeMessage(unit) {
  return `Wargear changed for ${unit.name || "Unit"}`;
}

function updateWargearCountFromEditor(roster, unit, target, optionRow, count, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: wargearChangeMessage(unit),
    nextRoster: rosterWithUnitWargearCount(roster, unit.id, {
      count,
      optionId: optionRow.id,
      rosterUnitMiniatureId: target.rosterUnitMiniatureId || "",
    }),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function wargearControlLabel(label, group) {
  const context = String(group?.instructionText || "").replace(/\s+/g, " ").trim();
  if (!context || context === label) {
    return label;
  }
  return `${label} - ${context}`;
}

function wargearGroupTitle(group, index = 0) {
  const instruction = String(group?.instructionText || "").replace(/\s+/g, " ").trim();
  if (!instruction) {
    return "Wargear";
  }
  if (instruction.toLowerCase() === "default wargear") {
    return "Default Wargear";
  }
  return `Choice ${index + 1}`;
}

function renderWargearOption({ group, label, onUndoableUpdate = null, onUpdate, optionRow, roster, target, unit }) {
  const row = document.createElement("div");
  row.className = "wargear-option-row";
  row.append(textNode("span", "", label));
  row.appendChild(countControl({
    label: wargearControlLabel(label, group),
    optionRow,
    target,
    onChange: async (count) => updateWargearCountFromEditor(
      roster,
      unit,
      target,
      optionRow,
      count,
      onUpdate,
      onUndoableUpdate
    ),
  }));
  if (group.instructionText) {
    row.title = group.instructionText;
  }
  return row;
}

function renderWargearGroup({ group, groupIndex = 0, onUndoableUpdate = null, onUpdate, roster, target, unit }) {
  const wrap = document.createElement("div");
  wrap.className = "wargear-group";
  const title = wargearGroupTitle(group, groupIndex);
  const instruction = String(group.instructionText || "").replace(/\s+/g, " ").trim();
  wrap.appendChild(textNode("h3", "wargear-group-title", title));
  if (instruction && instruction !== title) {
    wrap.appendChild(textNode("p", "wargear-group-instruction", instruction));
  }
  for (const row of wargearOptionRowsForGroup(group)) {
    wrap.appendChild(renderWargearOption({
      group,
      label: row.label,
      onUndoableUpdate,
      onUpdate,
      optionRow: row.optionRow,
      roster,
      target,
      unit,
    }));
  }
  return wrap;
}

export {
  renderWargearGroup,
  updateWargearCountFromEditor,
  wargearControlLabel,
  wargearGroupTitle,
  wargearChangeMessage,
};
