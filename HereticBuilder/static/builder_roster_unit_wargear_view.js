import { textNode } from "./builder_dom.js";
import { renderWargearGroup } from "./builder_roster_unit_wargear_options_view.js";
import {
  renderScopeValidation,
  targetIdForWargearScope,
  validationForWargearScope,
} from "./builder_roster_unit_wargear_validation_view.js";

function renderScopeHeader(heading, groupCount) {
  const header = document.createElement("div");
  header.className = "builder-section-head wargear-scope-head";
  header.appendChild(textNode("h2", "section-title", heading));
  if (groupCount) {
    header.appendChild(textNode("span", "section-meta", `${groupCount} group${groupCount === 1 ? "" : "s"}`));
  }
  return header;
}

function renderScope({ groups, heading, onUndoableUpdate = null, onUpdate, roster, target, unit }) {
  const wrap = document.createElement("section");
  wrap.className = "wargear-scope";
  wrap.appendChild(renderScopeHeader(heading, groups.length));
  if (!groups.length) {
    wrap.appendChild(textNode("p", "empty-list", "No wargear options"));
    return wrap;
  }
  let choiceIndex = 0;
  groups.forEach((group, groupIndex) => {
    const instruction = String(group?.instructionText || "").replace(/\s+/g, " ").trim().toLowerCase();
    const displayIndex = instruction === "default wargear" ? groupIndex : choiceIndex++;
    wrap.appendChild(renderWargearGroup({ group, groupIndex: displayIndex, onUndoableUpdate, onUpdate, roster, target, unit }));
  });
  return wrap;
}

function renderWargearScope({
  groups,
  heading,
  onUndoableUpdate = null,
  onUpdate,
  roster,
  target,
  unit,
  validation,
  validationContext,
}) {
  const scope = renderScope({ groups, heading, onUndoableUpdate, onUpdate, roster, target, unit });
  const targetId = targetIdForWargearScope(target);
  if (targetId) {
    scope.dataset.unitDetailTarget = `wargear:${targetId}`;
  }
  const scopeValidation = renderScopeValidation(validationForWargearScope(validation, targetId), validationContext);
  if (scopeValidation) {
    const header = scope.querySelector(".wargear-scope-head");
    header?.after(scopeValidation);
  }
  return scope;
}

export { renderWargearScope };
