import { option, textNode } from "./builder_dom.js";
import {
  availableCompositions,
  compositionFactionIds,
  compositionLabel,
} from "./builder_model.js";
import { rosterWithUnitComposition } from "./builder_roster_actions.js";

function renderCompositionEditor({ onUpdate, roster, unit }) {
  const factionIds = compositionFactionIds(roster, unit.allyType || "native");
  const compositions = availableCompositions(unit.datasheetId, factionIds, roster.detachmentIds || []);
  const select = document.createElement("select");
  for (const row of compositions) {
    select.appendChild(option(row.id, `${compositionLabel(row)} (${row.points || 0} pts)`));
  }
  select.value = unit.compositionId || compositions[0]?.id || "";
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => {
    await onUpdate(rosterWithUnitComposition(roster, unit.id, select.value));
  });
  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "composition";
  wrap.append(textNode("span", "", "Composition"), select);
  return wrap;
}

export { renderCompositionEditor };
