import { option, textNode } from "./builder_dom.js";
import { WARLORD_SELECT_LABEL, labelControl } from "./builder_roster_control_labels.js";
import { rosterWithWarlord } from "./builder_roster_actions.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { warlordPickerModel } from "./builder_roster_warlord_options.js";

function warlordPickerChangeMessage() {
  return "Warlord changed";
}

function updateWarlordFromPicker(roster, value, context, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: warlordPickerChangeMessage(),
    nextRoster: value ? rosterWithWarlord(roster, {
      ...JSON.parse(value),
      ...context,
    }) : rosterWithWarlord(roster, {}),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function renderWarlordPicker({ onUndoableUpdate = null, onUpdate, roster }) {
  const model = warlordPickerModel(roster);
  if (!model.units.length) {
    return null;
  }
  const select = document.createElement("select");
  labelControl(select, WARLORD_SELECT_LABEL);
  select.dataset.focusTarget = "true";
  for (const row of model.options) {
    select.appendChild(option(row.value, row.label, { disabled: Boolean(row.disabled) }));
  }
  select.value = model.currentValue;
  select.disabled = model.disabled;
  select.addEventListener("change", async () => updateWarlordFromPicker(roster, select.value, {
      detachments: model.detachments,
      units: model.units,
    }, onUpdate, onUndoableUpdate));

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.editorTarget = "warlord";
  wrap.append(textNode("span", "", "Warlord"), select);
  return wrap;
}

export { renderWarlordPicker, updateWarlordFromPicker, warlordPickerChangeMessage };
