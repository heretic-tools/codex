import { button } from "./builder_dom.js";

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

function unitValidationActionTarget(group) {
  const code = group.code || "";
  if (code.startsWith("wargear_loadout.")) {
    if ((group.targetIds || []).length === 1) {
      return { target: `wargear:${group.targetIds[0]}`, text: "Wargear" };
    }
    return { target: "wargear", text: "Wargear" };
  }
  if (code.startsWith("enhancement.") || code === "warlord.invalid_due_to_enhancement") {
    if ((group.targetIds || []).length === 1) {
      return { target: `enhancement:${group.targetIds[0]}`, text: "Enhancements" };
    }
    return { target: "enhancements", text: "Enhancements" };
  }
  if (code.startsWith("allegiance_ability.")) {
    return { target: "allegiance", text: "Ability" };
  }
  if (code.startsWith("warlord.") || code.startsWith("mandatory_warlord.")) {
    return { target: "warlord", text: "Warlord" };
  }
  if (code.startsWith("unit_composition.") || code === "unit.max_model_count_too_many_models") {
    return { target: "composition", text: "Composition" };
  }
  return null;
}

function renderUnitValidationAction(group) {
  const action = unitValidationActionTarget(group);
  return action
    ? button("validation-action-button", action.text, () => scrollToUnitDetailTarget(action.target))
    : null;
}

export { renderUnitValidationAction, scrollToUnitDetailTarget, unitValidationActionTarget };
