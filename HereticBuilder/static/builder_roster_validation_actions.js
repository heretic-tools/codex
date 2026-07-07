import { button } from "./builder_dom.js";
import { detachmentCodexHref } from "./builder_codex_links.js";
import { state } from "./builder_state.js";
import { scrollToEditorRow, scrollToEditorTarget, scrollToUnitSearch } from "./builder_roster_validation_action_scroll.js";
import { rosterValidationActionTarget } from "./builder_roster_validation_action_targets.js";
import { labelValidationAction, validationActionLabel } from "./builder_validation_action_labels.js";

function validationActionLink(action, group, href) {
  const node = document.createElement("a");
  node.className = "validation-action-button";
  node.textContent = action.text;
  node.href = href;
  return labelValidationAction(node, validationActionLabel(action, group));
}

function validationActionButton(action, group, onClick, context = {}) {
  const node = button("validation-action-button", action.text, onClick);
  return labelValidationAction(node, validationActionLabel(action, group, context));
}

function renderValidationGroupAction(group, { onUnitOpen, roster, unitById }) {
  const action = rosterValidationActionTarget(group, { roster });
  if (!action) {
    return null;
  }
  if (action.kind === "unit") {
    const unit = unitById.get(action.unitId);
    return unit
      ? validationActionButton(
        action,
        group,
        () => onUnitOpen(unit, action.focusTarget || ""),
        { unit }
      )
      : null;
  }
  if (action.kind === "detachmentCodex") {
    const href = detachmentCodexHref(roster.factionKeywordId, action.detachmentId);
    return href ? validationActionLink(action, group, href) : null;
  }
  if (action.kind === "row") {
    return validationActionButton(action, group, () => scrollToEditorRow(action.attribute, action.value));
  }
  if (action.kind === "unitSearch") {
    const query = state.catalog.datasheetById.get(action.datasheetId)?.name || "";
    return validationActionButton(action, group, () => scrollToUnitSearch(query), { query });
  }
  return validationActionButton(action, group, () => scrollToEditorTarget(action.target));
}

export {
  renderValidationGroupAction,
  rosterValidationActionTarget,
  validationActionLabel,
};
