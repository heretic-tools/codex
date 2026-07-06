import { textNode } from "./builder_dom.js";
import {
  groupedMessages,
  validationScopeLabels,
} from "./builder_validation_groups.js";
import {
  appendGroupedMessages,
  renderValidationMessages,
  validationGroupBodyTexts,
  validationGroupTitle,
  validationSummary,
} from "./builder_validation_message_list.js";
import {
  validationForAttachment,
  validationForDetachment,
  validationForTarget,
  validationForUnit,
} from "./builder_validation_scopes.js";

function renderValidation(validation, { context = {}, groupAction = null, title = "Validation" } = {}) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section";
  wrap.appendChild(textNode("h2", "section-title", title));
  const list = document.createElement("div");
  list.className = "validation-list";
  list.appendChild(textNode(
    "div",
    `validation-item validation-summary ${validation.messages.some((message) => message.level === "error") ? "error" : "ok"}`,
    validationSummary(validation)
  ));
  appendGroupedMessages(list, validation.messages, context, groupAction);
  wrap.appendChild(list);
  return wrap;
}

export {
  groupedMessages,
  renderValidation,
  renderValidationMessages,
  validationGroupBodyTexts,
  validationGroupTitle,
  validationScopeLabels,
  validationForAttachment,
  validationForDetachment,
  validationForTarget,
  validationForUnit,
};
