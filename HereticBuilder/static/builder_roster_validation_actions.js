import { button } from "./builder_dom.js";
import { detachmentCodexHref } from "./builder_codex_links.js";
import { state } from "./builder_state.js";
import { scrollToEditorRow, scrollToEditorTarget, scrollToUnitSearch } from "./builder_roster_validation_action_scroll.js";
import { rosterValidationActionTarget } from "./builder_roster_validation_action_targets.js";

function validationActionLink(text, href) {
  const node = document.createElement("a");
  node.className = "validation-action-button";
  node.textContent = text;
  node.href = href;
  return node;
}

function renderValidationGroupAction(group, { onUnitOpen, roster, unitById }) {
  const action = rosterValidationActionTarget(group);
  if (!action) {
    return null;
  }
  if (action.kind === "unit") {
    const unit = unitById.get(action.unitId);
    return unit ? button("validation-action-button", action.text, () => onUnitOpen(unit)) : null;
  }
  if (action.kind === "detachmentCodex") {
    const href = detachmentCodexHref(roster.factionKeywordId, action.detachmentId);
    return href ? validationActionLink(action.text, href) : null;
  }
  if (action.kind === "row") {
    return button("validation-action-button", action.text, () => scrollToEditorRow(action.attribute, action.value));
  }
  if (action.kind === "unitSearch") {
    const query = state.catalog.datasheetById.get(action.datasheetId)?.name || "";
    return button("validation-action-button", action.text, () => scrollToUnitSearch(query));
  }
  return button("validation-action-button", action.text, () => scrollToEditorTarget(action.target));
}

export {
  renderValidationGroupAction,
  rosterValidationActionTarget,
};
