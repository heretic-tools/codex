import { button } from "./builder_dom.js";
import { unitValidationActionTarget } from "./builder_roster_unit_validation_targets.js";

function scrollToUnitDetailTarget(target) {
  const selectorValue = window.CSS?.escape ? CSS.escape(target) : String(target).replace(/"/g, "");
  const node = document.querySelector(`[data-unit-detail-target="${selectorValue}"]`);
  if (!node) {
    return;
  }
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusTarget = node.querySelector("[data-focus-target]")
    || (node.matches("button, input, select, textarea, a")
      ? node
      : node.querySelector("button, input, select, textarea, a"));
  focusTarget?.focus({ preventScroll: true });
  node.classList.add("is-attention-target");
  window.setTimeout(() => node.classList.remove("is-attention-target"), 900);
}

function renderUnitValidationAction(group) {
  const action = unitValidationActionTarget(group);
  return action
    ? button("validation-action-button", action.text, () => scrollToUnitDetailTarget(action.target))
    : null;
}

export { renderUnitValidationAction, scrollToUnitDetailTarget, unitValidationActionTarget };
