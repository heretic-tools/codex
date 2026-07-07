import { button } from "./builder_dom.js";
import { expandDisclosure } from "./builder_roster_validation_action_scroll.js";
import { unitValidationActionTarget } from "./builder_roster_unit_validation_targets.js";
import { labelValidationAction, validationActionLabel } from "./builder_validation_action_labels.js";

function scrollToUnitDetailTarget(target) {
  const selectorValue = window.CSS?.escape ? CSS.escape(target) : String(target).replace(/"/g, "");
  const node = document.querySelector(`[data-unit-detail-target="${selectorValue}"]`);
  if (!node) {
    return;
  }
  expandDisclosure(node);
  const focusTarget = node.querySelector("[data-focus-target]")
    || (node.matches("button, input, select, textarea, a")
      ? node
      : node.querySelector("button, input, select, textarea, a"));
  const scrollTarget = focusTarget || node;
  scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
  focusTarget?.focus({ preventScroll: true });
  node.classList.add("is-attention-target");
  window.setTimeout(() => node.classList.remove("is-attention-target"), 900);
}

function renderUnitValidationAction(group) {
  const action = unitValidationActionTarget(group);
  return action
    ? labelValidationAction(
      button("validation-action-button", action.text, () => scrollToUnitDetailTarget(action.target)),
      validationActionLabel(action, group)
    )
    : null;
}

export {
  renderUnitValidationAction,
  scrollToUnitDetailTarget,
  validationActionLabel as unitValidationActionLabel,
  unitValidationActionTarget,
};
