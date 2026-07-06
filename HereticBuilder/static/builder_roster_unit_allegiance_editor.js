import { option, textNode } from "./builder_dom.js";
import { rosterWithUnitAllegianceAbility } from "./builder_roster_actions.js";
import { allegianceEditorOptions } from "./builder_roster_unit_allegiance_options.js";

function renderAllegianceEditor({ onUpdate, roster, unit }) {
  const model = allegianceEditorOptions(roster, unit);
  if (!model) {
    return null;
  }
  const select = document.createElement("select");
  for (const row of model.options) {
    select.appendChild(option(row.value, row.label));
  }
  select.value = model.currentId;
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => {
    await onUpdate(rosterWithUnitAllegianceAbility(roster, unit.id, select.value, {
      detachments: model.detachments,
      unit,
      units: model.units,
    }));
  });

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "allegiance";
  wrap.append(textNode("span", "", model.label), select);
  return wrap;
}

export { renderAllegianceEditor };
