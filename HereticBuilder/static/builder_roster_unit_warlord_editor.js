import { option, textNode } from "./builder_dom.js";
import { rosterWithWarlord } from "./builder_roster_actions.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { renderUnitEditorValidation } from "./builder_roster_unit_editor_validation_view.js";
import { unitWarlordSelectModel } from "./builder_roster_unit_warlord_options.js";

function warlordChangeMessage(unit) {
  return `Warlord changed for ${unit.name || "Unit"}`;
}

function updateUnitWarlordFromEditor(roster, unit, rosterUnitMiniatureId, context, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: warlordChangeMessage(unit),
    nextRoster: rosterWithWarlord(roster, {
      ...context,
      rosterUnitMiniatureId,
      unitId: rosterUnitMiniatureId ? unit.id : "",
    }),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function renderWarlordEditor({
  onUndoableUpdate = null,
  onUpdate,
  roster,
  unit,
  validation = null,
  validationContext = {},
}) {
  const model = unitWarlordSelectModel(roster, unit);
  const select = document.createElement("select");
  for (const row of model.options) {
    select.appendChild(option(row.value, row.label, { disabled: Boolean(row.disabled) }));
  }
  select.value = model.currentId;
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => updateUnitWarlordFromEditor(roster, unit, select.value, {
    detachments: model.context.detachments,
    units: model.context.units,
  }, onUpdate, onUndoableUpdate));

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "warlord";
  wrap.append(textNode("span", "", "Warlord"), select);
  const validationNode = renderUnitEditorValidation(validation, validationContext, "warlord");
  if (validationNode) {
    wrap.appendChild(validationNode);
  }
  return wrap;
}

export { renderWarlordEditor, updateUnitWarlordFromEditor, warlordChangeMessage };
