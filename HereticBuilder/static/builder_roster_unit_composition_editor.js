import { option, textNode } from "./builder_dom.js";
import { rosterWithUnitComposition } from "./builder_roster_actions.js";
import { labelControl } from "./builder_roster_control_labels.js";
import { ensurePrecomputedLoadoutsForDatasheets } from "./builder_precomputed_loadouts_runtime.js";
import { compositionSelectModel } from "./builder_roster_unit_composition_options.js";
import { renderUnitEditorValidation } from "./builder_roster_unit_editor_validation_view.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";

function compositionChangeMessage(unit) {
  return `Composition changed for ${unit.name || "Unit"}`;
}

function updateUnitCompositionFromEditor(roster, unit, compositionId, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: compositionChangeMessage(unit),
    nextRoster: rosterWithUnitComposition(roster, unit.id, compositionId),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function unitHasCompositionChoices(roster, unit) {
  return compositionSelectModel(roster, unit).options.length > 1;
}

function renderCompositionEditor({
  onUndoableUpdate = null,
  onUpdate,
  roster,
  unit,
  validation = null,
  validationContext = {},
}) {
  const model = compositionSelectModel(roster, unit);
  const hasChoices = model.options.length > 1;
  const validationNode = renderUnitEditorValidation(validation, validationContext, "composition");
  if (!hasChoices && model.options.length === 1 && !validationNode) {
    return null;
  }
  const wrap = document.createElement(hasChoices ? "label" : "div");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "composition";
  wrap.appendChild(textNode("span", "", "Composition"));
  if (hasChoices) {
    const select = document.createElement("select");
    labelControl(select, "Choose composition");
    for (const row of model.options) {
      select.appendChild(option(row.value, row.label));
    }
    select.value = model.currentId;
    select.dataset.focusTarget = "true";
    select.addEventListener("change", async () => {
      await ensurePrecomputedLoadoutsForDatasheets([unit.datasheetId]);
      await updateUnitCompositionFromEditor(roster, unit, select.value, onUpdate, onUndoableUpdate);
    });
    wrap.appendChild(select);
  } else {
    wrap.className = "field field-readonly";
    wrap.appendChild(textNode(
      "strong",
      "field-readonly-value",
      model.options[0]?.label || "No valid composition"
    ));
  }
  if (validationNode) {
    wrap.appendChild(validationNode);
  }
  return wrap;
}

export {
  compositionChangeMessage,
  renderCompositionEditor,
  unitHasCompositionChoices,
  updateUnitCompositionFromEditor,
};
