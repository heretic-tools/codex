import { textNode } from "./builder_dom.js";
import { rosterWithUnitWargearCount } from "./builder_roster_actions.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { countControl, currentCount } from "./builder_roster_unit_wargear_count_control.js";
import {
  wargearOptionName,
  wargearOptionRowsForGroup,
} from "./builder_roster_unit_wargear_options.js";

function wargearChangeMessage(unit, optionRow = null) {
  const optionName = wargearOptionName(optionRow);
  const subject = optionName ? `${optionName} changed` : "Wargear changed";
  return `${subject} for ${unit.name || "Unit"}`;
}

function updateWargearCountFromEditor(roster, unit, target, optionRow, count, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: wargearChangeMessage(unit, optionRow),
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

function wargearControlLabel(label, group, groupTitle = "") {
  const context = String(group?.instructionText || "").replace(/\s+/g, " ").trim();
  if (!context || context === label) {
    return label;
  }
  const compactContext = String(groupTitle || "").replace(/\s+/g, " ").trim() || wargearGroupTitle(group);
  if (!compactContext || compactContext === "Wargear" || compactContext === label) {
    return label;
  }
  return `${label} - ${compactContext}`;
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

function wargearGroupIsDefault(group) {
  return String(group?.instructionText || "").replace(/\s+/g, " ").trim().toLowerCase() === "default wargear";
}

function wargearGroupOptionRows(group) {
  return wargearOptionRowsForGroup(group);
}

function wargearGroupIsFixedDefault(group) {
  const rows = wargearGroupOptionRows(group);
  return wargearGroupIsDefault(group)
    && rows.length > 0
    && rows.every((row) => Number(row.optionRow.defaultValue || 0) > 0);
}

function wargearScopeIsFixedDefault(groups = []) {
  return groups.length > 0 && groups.every(wargearGroupIsFixedDefault);
}

function readOnlyWargearValue(target, optionRow) {
  const count = currentCount(target, optionRow.id);
  if (count <= 0) {
    return "Missing";
  }
  return count > 1 ? `x${count}` : "Fixed";
}

function renderWargearOption({
  group,
  groupTitle = "",
  label,
  onUndoableUpdate = null,
  onUpdate,
  optionRow,
  readOnly = false,
  roster,
  target,
  unit,
}) {
  const row = document.createElement("div");
  row.className = readOnly ? "wargear-option-row wargear-option-row-readonly" : "wargear-option-row";
  row.append(textNode("span", "", label));
  if (readOnly) {
    row.appendChild(textNode("span", "wargear-readonly-value", readOnlyWargearValue(target, optionRow)));
  } else {
    row.appendChild(countControl({
      label: wargearControlLabel(label, group, groupTitle),
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
  }
  if (group.instructionText) {
    row.title = group.instructionText;
  }
  return row;
}

function renderWargearGroup({ group, groupIndex = 0, onUndoableUpdate = null, onUpdate, readOnly = false, roster, target, unit }) {
  const wrap = document.createElement("div");
  wrap.className = "wargear-group";
  const title = wargearGroupTitle(group, groupIndex);
  const instruction = String(group.instructionText || "").replace(/\s+/g, " ").trim();
  wrap.appendChild(textNode("h3", "wargear-group-title", title));
  if (instruction && instruction !== title) {
    wrap.appendChild(textNode("p", "wargear-group-instruction", instruction));
  }
  for (const row of wargearGroupOptionRows(group)) {
    wrap.appendChild(renderWargearOption({
      group,
      groupTitle: title,
      label: row.label,
      onUndoableUpdate,
      onUpdate,
      optionRow: row.optionRow,
      readOnly,
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
  readOnlyWargearValue,
  wargearControlLabel,
  wargearGroupIsFixedDefault,
  wargearGroupTitle,
  wargearScopeIsFixedDefault,
  wargearChangeMessage,
};
