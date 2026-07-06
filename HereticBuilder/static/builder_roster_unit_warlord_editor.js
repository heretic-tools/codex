import { option, textNode } from "./builder_dom.js";
import { rosterWithWarlord } from "./builder_roster_actions.js";
import { renderUnitEditorValidation } from "./builder_roster_unit_editor_validation_view.js";
import { warlordSelectionContext } from "./builder_roster_warlord_options.js";
import { warlordCandidateStatus } from "./builder_warlord_rules.js";

function currentWarlordTargetId(unit) {
  return (unit.miniatures || []).find((miniature) => miniature.isWarlord)?.rosterUnitMiniatureId || "";
}

function renderWarlordEditor({ onUpdate, roster, unit, validation = null, validationContext = {} }) {
  const context = warlordSelectionContext(roster);
  const select = document.createElement("select");
  select.appendChild(option("", "No warlord for this unit"));
  for (const miniature of unit.miniatures || []) {
    const targetId = miniature.rosterUnitMiniatureId || miniature.id;
    const status = warlordCandidateStatus(roster, context.detachments, context.units, unit, miniature);
    const suffix = status.eligible ? "" : ` / ${status.reason}`;
    select.appendChild(option(targetId, `${miniature.name} (${miniature.count || 0})${suffix}`));
  }
  select.value = currentWarlordTargetId(unit);
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => onUpdate(rosterWithWarlord(roster, {
    detachments: context.detachments,
    rosterUnitMiniatureId: select.value,
    unitId: select.value ? unit.id : "",
    units: context.units,
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
