import { option, textNode } from "./builder_dom.js";
import { rosterWithWarlord } from "./builder_roster_actions.js";
import { renderUnitEditorValidation } from "./builder_roster_unit_editor_validation_view.js";
import { unitWarlordSelectModel } from "./builder_roster_unit_warlord_options.js";

function renderWarlordEditor({ onUpdate, roster, unit, validation = null, validationContext = {} }) {
  const model = unitWarlordSelectModel(roster, unit);
  const select = document.createElement("select");
  for (const row of model.options) {
    select.appendChild(option(row.value, row.label, { disabled: Boolean(row.disabled) }));
  }
  select.value = model.currentId;
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => onUpdate(rosterWithWarlord(roster, {
    detachments: model.context.detachments,
    rosterUnitMiniatureId: select.value,
    unitId: select.value ? unit.id : "",
    units: model.context.units,
  })));

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

export { renderWarlordEditor };
