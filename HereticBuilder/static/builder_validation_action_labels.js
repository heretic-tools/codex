import { validationGroupTitle } from "./builder_validation_message_list.js";

function labelValidationAction(node, label) {
  node.title = label;
  node.setAttribute("aria-label", label);
  return node;
}

function validationActionLabel(action, group, { query = "", unit = null } = {}) {
  const title = validationGroupTitle(group);
  if (action.kind === "unit") {
    return `Open unit: ${unit?.name || title}`;
  }
  if (action.kind === "unitSearch") {
    return query ? `Find unit: ${query}` : `Find unit: ${title}`;
  }
  if (action.kind === "detachmentCodex") {
    return `Open detachment rules: ${title}`;
  }
  return `${action.text}: ${title}`;
}

export { labelValidationAction, validationActionLabel };
