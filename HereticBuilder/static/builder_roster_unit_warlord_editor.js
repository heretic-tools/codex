import { option, textNode } from "./builder_dom.js";
import { rosterWithWarlord } from "./builder_roster_actions.js";

function currentWarlordTargetId(unit) {
  return (unit.miniatures || []).find((miniature) => miniature.isWarlord)?.rosterUnitMiniatureId || "";
}

function renderWarlordEditor({ onUpdate, roster, unit }) {
  const select = document.createElement("select");
  select.appendChild(option("", "No warlord for this unit"));
  for (const miniature of unit.miniatures || []) {
    const targetId = miniature.rosterUnitMiniatureId || miniature.id;
    select.appendChild(option(targetId, `${miniature.name} (${miniature.count || 0})`));
  }
  select.value = currentWarlordTargetId(unit);
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => onUpdate(rosterWithWarlord(roster, {
    rosterUnitMiniatureId: select.value,
    unitId: select.value ? unit.id : "",
  })));

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "warlord";
  wrap.append(textNode("span", "", "Warlord"), select);
  return wrap;
}

export { renderWarlordEditor };
