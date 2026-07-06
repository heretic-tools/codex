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
import { validationCounts } from "./builder_validation_summary.js";
import {
  validationForAttachment,
  validationForDetachment,
  validationForTarget,
  validationForUnit,
} from "./builder_validation_scopes.js";

function validationMessages(validation) {
  return validation.messages || [];
}

function validationStateClass(validation) {
  const counts = validationCounts(validationMessages(validation));
  if (counts.error) {
    return "error";
  }
  if (counts.warning) {
    return "warning";
  }
  return "ok";
}

function validationMetaText(validation) {
  const counts = validationCounts(validationMessages(validation));
  const parts = [];
  if (counts.error) {
    parts.push(`${counts.error} error${counts.error === 1 ? "" : "s"}`);
  }
  if (counts.warning) {
    parts.push(`${counts.warning} warning${counts.warning === 1 ? "" : "s"}`);
  }
  return parts.length ? parts.join(" / ") : "No issues";
}

function renderValidationHeader(title, validation) {
  const head = document.createElement("div");
  head.className = "builder-section-head validation-section-head";
  head.append(
    textNode("h2", "section-title", title),
    textNode("span", `validation-section-meta state-${validationStateClass(validation)}`, validationMetaText(validation))
  );
  return head;
}

function renderValidation(validation, { context = {}, groupAction = null, title = "Validation" } = {}) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section validation-section";
  wrap.appendChild(renderValidationHeader(title, validation));
  const list = document.createElement("div");
  list.className = "validation-list";
  list.appendChild(textNode(
    "div",
    `validation-item validation-summary ${validationStateClass(validation)}`,
    validationSummary(validation)
  ));
  appendGroupedMessages(list, validationMessages(validation), context, groupAction);
  wrap.appendChild(list);
  return wrap;
}

export {
  groupedMessages,
  renderValidation,
  renderValidationMessages,
  validationMetaText,
  validationGroupBodyTexts,
  validationGroupTitle,
  validationScopeLabels,
  validationStateClass,
  validationForAttachment,
  validationForDetachment,
  validationForTarget,
  validationForUnit,
};
