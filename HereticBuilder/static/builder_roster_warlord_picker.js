import { option, textNode } from "./builder_dom.js";
import { rosterWithWarlord } from "./builder_roster_actions.js";
import { warlordPickerModel } from "./builder_roster_warlord_options.js";

function renderWarlordPicker({ onUpdate, roster }) {
  const model = warlordPickerModel(roster);
  const select = document.createElement("select");
  select.dataset.focusTarget = "true";
  for (const row of model.options) {
    select.appendChild(option(row.value, row.label));
  }
  select.value = model.currentValue;
  select.disabled = model.disabled;
  select.addEventListener("change", async () => {
    await onUpdate(select.value ? rosterWithWarlord(roster, {
      ...JSON.parse(select.value),
      detachments: model.detachments,
      units: model.units,
    }) : rosterWithWarlord(roster, {}));
  });

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.editorTarget = "warlord";
  wrap.append(textNode("span", "", "Warlord"), select);
  return wrap;
}

export { renderWarlordPicker };
