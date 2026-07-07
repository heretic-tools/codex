import { option, textNode } from "./builder_dom.js";
import { rosterWithUnitAllegianceAbility } from "./builder_roster_actions.js";
import { labelControl } from "./builder_roster_control_labels.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { allegianceEditorOptions } from "./builder_roster_unit_allegiance_options.js";
import { renderUnitEditorValidation } from "./builder_roster_unit_editor_validation_view.js";

function allegianceChangeMessage(unit) {
  return `Allegiance changed for ${unit.name || "Unit"}`;
}

function updateUnitAllegianceFromEditor(roster, unit, allegianceAbilityId, context, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: allegianceChangeMessage(unit),
    nextRoster: rosterWithUnitAllegianceAbility(roster, unit.id, allegianceAbilityId, context),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function renderAllegianceEditor({
  onUndoableUpdate = null,
  onUpdate,
  roster,
  unit,
  validation = null,
  validationContext = {},
}) {
  const model = allegianceEditorOptions(roster, unit);
  if (!model) {
    return null;
  }
  const validationNode = renderUnitEditorValidation(validation, validationContext, "allegiance");
  const hasSelectableOption = model.options.some((row) => row.value && !row.disabled);
  if (!model.currentId && !hasSelectableOption && !validationNode) {
    return null;
  }
  const select = document.createElement("select");
  labelControl(select, `Choose ${model.label || "allegiance"}`);
  for (const row of model.options) {
    select.appendChild(option(row.value, row.label, { disabled: Boolean(row.disabled) }));
  }
  select.value = model.currentId;
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => {
    await updateUnitAllegianceFromEditor(roster, unit, select.value, {
      detachments: model.detachments,
      unit,
      units: model.units,
    }, onUpdate, onUndoableUpdate);
  });

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "allegiance";
  wrap.append(textNode("span", "", model.label), select);
  if (validationNode) {
    wrap.appendChild(validationNode);
  }
  return wrap;
}

export { allegianceChangeMessage, renderAllegianceEditor, updateUnitAllegianceFromEditor };
