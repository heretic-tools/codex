import { button } from "./builder_dom.js";
import { rosterValidationActionTarget } from "./builder_roster_validation_action_targets.js";
import { expandDisclosure } from "./builder_roster_validation_action_scroll.js";
import { unitValidationActionTarget } from "./builder_roster_unit_validation_targets.js";
import { labelValidationAction, validationActionLabel } from "./builder_validation_action_labels.js";

const ROW_FOCUS_TARGETS = {
  "attachment-id": "attachments",
  "detachment-id": "detachments",
  "unit-id": "units",
};

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

function renderRosterTargetActionFromUnitDetail(group, roster) {
  if (!roster?.id) {
    return null;
  }
  const action = rosterValidationActionTarget(group, { roster });
  if (action?.kind === "target" && action.target === "detachments") {
    return validationActionLink(action, group, rosterFocusHref(roster.id, action.target));
  }
  return null;
}

function renderUnitValidationAction(group, { roster = null } = {}) {
  const rosterTargetAction = renderRosterTargetActionFromUnitDetail(group, roster);
  if (rosterTargetAction) {
    return rosterTargetAction;
  }
  const action = unitValidationActionTarget(group);
  return action
    ? labelValidationAction(
      button("validation-action-button", action.text, () => scrollToUnitDetailTarget(action.target)),
      validationActionLabel(action, group)
    )
    : null;
}

function rosterFocusTargetForValidationAction(action) {
  if (action.kind === "target") {
    return action.target;
  }
  if (action.kind === "row") {
    return ROW_FOCUS_TARGETS[action.attribute] || "";
  }
  if (action.kind === "unitSearch") {
    return "units";
  }
  return "";
}

function unitSearchFocusTarget(query = "") {
  return query ? `unitSearch:${query}` : "units";
}

function rosterFocusHref(rosterId, target = "") {
  const rosterPath = `/roster/${encodeURIComponent(rosterId || "")}`;
  return `#${target ? `${rosterPath}/focus/${encodeURIComponent(target)}` : rosterPath}`;
}

function unitFocusHref(rosterId, unitId, target = "") {
  const unitPath = `/roster/${encodeURIComponent(rosterId || "")}/unit/${encodeURIComponent(unitId || "")}`;
  return `#${target ? `${unitPath}/focus/${encodeURIComponent(target)}` : unitPath}`;
}

function validationActionLink(action, group, href, context = {}) {
  const node = document.createElement("a");
  node.className = "validation-action-button";
  node.textContent = action.text;
  node.href = href;
  return labelValidationAction(node, validationActionLabel(action, group, context));
}

function localValidationActionButton(action, group, localTargets = new Set()) {
  if (action?.kind !== "target" || !localTargets.has(action.target)) {
    return null;
  }
  return labelValidationAction(
    button("validation-action-button", action.text, () => scrollToUnitDetailTarget(action.target)),
    validationActionLabel(action, group)
  );
}

function renderRosterValidationActionLink(group, {
  datasheetById = new Map(),
  localTargets = new Set(),
  roster,
  unitById = new Map(),
} = {}) {
  const action = rosterValidationActionTarget(group, { roster });
  if (!action || !roster?.id) {
    return null;
  }
  const localAction = localValidationActionButton(action, group, localTargets);
  if (localAction) {
    return localAction;
  }
  if (action.kind === "unit") {
    const unit = unitById.get(action.unitId);
    return validationActionLink(
      action,
      group,
      unitFocusHref(roster.id, action.unitId, action.focusTarget || ""),
      { unit }
    );
  }
  if (action.kind === "detachmentCodex") {
    const detachmentAction = { kind: "target", target: "detachments", text: "Detachments" };
    return validationActionLink(
      detachmentAction,
      group,
      rosterFocusHref(roster.id, detachmentAction.target)
    );
  }
  if (action.kind === "unitSearch") {
    const query = datasheetById.get(action.datasheetId)?.name || "";
    return validationActionLink(
      action,
      group,
      rosterFocusHref(roster.id, unitSearchFocusTarget(query)),
      { query }
    );
  }
  const focusTarget = rosterFocusTargetForValidationAction(action);
  return validationActionLink(action, group, rosterFocusHref(roster.id, focusTarget));
}

export {
  renderRosterTargetActionFromUnitDetail,
  renderRosterValidationActionLink,
  renderUnitValidationAction,
  rosterFocusHref,
  rosterFocusTargetForValidationAction,
  scrollToUnitDetailTarget,
  unitFocusHref,
  unitSearchFocusTarget,
  validationActionLabel as unitValidationActionLabel,
  unitValidationActionTarget,
};
