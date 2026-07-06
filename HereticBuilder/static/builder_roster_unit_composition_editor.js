import { option, textNode } from "./builder_dom.js";
import { rosterWithUnitComposition } from "./builder_roster_actions.js";
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

function renderCompositionEditor({
  onUndoableUpdate = null,
  onUpdate,
  roster,
  unit,
  validation = null,
  validationContext = {},
}) {
  const model = compositionSelectModel(roster, unit);
  const select = document.createElement("select");
  for (const row of model.options) {
    select.appendChild(option(row.value, row.label));
  }
  select.value = model.currentId;
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => {
    await ensurePrecomputedLoadoutsForDatasheets([unit.datasheetId]);
    await updateUnitCompositionFromEditor(roster, unit, select.value, onUpdate, onUndoableUpdate);
  });
  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "composition";
  wrap.append(textNode("span", "", "Composition"), select);
  const validationNode = renderUnitEditorValidation(validation, validationContext, "composition");
  if (validationNode) {
    wrap.appendChild(validationNode);
  }
  return wrap;
}

export { compositionChangeMessage, renderCompositionEditor, updateUnitCompositionFromEditor };
