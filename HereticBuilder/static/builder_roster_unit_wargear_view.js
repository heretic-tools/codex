import { textNode } from "./builder_dom.js";
import { renderWargearGroup } from "./builder_roster_unit_wargear_options_view.js";
import {
  renderScopeValidation,
  targetIdForWargearScope,
  validationForWargearScope,
} from "./builder_roster_unit_wargear_validation_view.js";

function renderScope({ groups, heading, onUpdate, roster, target, unit }) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section wargear-scope";
  wrap.appendChild(textNode("h2", "section-title", heading));
  if (!groups.length) {
    wrap.appendChild(textNode("p", "empty-list", "No wargear options"));
    return wrap;
  }
  for (const group of groups) {
    wrap.appendChild(renderWargearGroup({ group, onUpdate, roster, target, unit }));
  }
  return wrap;
}

function renderWargearScope({ groups, heading, onUpdate, roster, target, unit, validation, validationContext }) {
  const scope = renderScope({ groups, heading, onUpdate, roster, target, unit });
  const targetId = targetIdForWargearScope(target);
  if (targetId) {
    scope.dataset.unitDetailTarget = `wargear:${targetId}`;
  }
  const scopeValidation = renderScopeValidation(validationForWargearScope(validation, targetId), validationContext);
  if (scopeValidation) {
    const title = scope.querySelector(".section-title");
    title?.after(scopeValidation);
  }
  return scope;
}

export { renderWargearScope };
