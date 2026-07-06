import { option, textNode } from "./builder_dom.js";
import { rosterWithUnitComposition } from "./builder_roster_actions.js";
import { compositionSelectModel } from "./builder_roster_unit_composition_options.js";
import { renderUnitEditorValidation } from "./builder_roster_unit_editor_validation_view.js";

function renderCompositionEditor({ onUpdate, roster, unit, validation = null, validationContext = {} }) {
  const model = compositionSelectModel(roster, unit);
  const select = document.createElement("select");
  for (const row of model.options) {
    select.appendChild(option(row.value, row.label));
  }
  select.value = model.currentId;
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => {
    await onUpdate(rosterWithUnitComposition(roster, unit.id, select.value));
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

export { renderCompositionEditor };
