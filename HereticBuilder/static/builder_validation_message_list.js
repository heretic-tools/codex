import { textNode } from "./builder_dom.js";
import { groupedMessages } from "./builder_validation_groups.js";
export { validationSummary } from "./builder_validation_summary.js";

function validationGroupTitle(group) {
  return group.texts?.[0] || group.code || "Validation issue";
}

function validationGroupBodyTexts(group) {
  const title = validationGroupTitle(group);
  return (group.texts || []).filter((text, index) => index > 0 || text !== title);
}

function setValidationCode(node, code) {
  if (node.dataset) {
    node.dataset.validationCode = code;
  } else if (node.setAttribute) {
    node.setAttribute("data-validation-code", code);
  }
}

function validationSeverityLabel(level) {
  if (level === "warning") {
    return "Warning";
  }
  if (level === "ok") {
    return "OK";
  }
  return "Error";
}

function validationSeverityMarker(level) {
  const marker = textNode("span", `validation-severity-marker ${level}`, level === "warning" ? "!" : "X");
  const label = validationSeverityLabel(level);
  marker.title = label;
  if (marker.setAttribute) {
    marker.setAttribute("aria-label", label);
  }
  return marker;
}

function appendGroupedMessages(list, messages, context = {}, groupAction = null) {
  for (const group of groupedMessages(messages, context)) {
    const item = textNode("div", `validation-item ${group.level}`, "");
    setValidationCode(item, group.code);
    const head = document.createElement("div");
    head.className = "validation-row-head";
    const action = groupAction?.(group);
    const title = textNode("strong", "", validationGroupTitle(group));
    title.title = group.code;
    head.append(
      validationSeverityMarker(group.level),
      title,
      textNode("span", "validation-count", String(group.count))
    );
    if (action) {
      head.appendChild(action);
    }
    item.appendChild(head);
    if (group.scopeLabels.length) {
      const scopes = document.createElement("div");
      scopes.className = "validation-scope-row";
      for (const label of group.scopeLabels) {
        scopes.appendChild(textNode("span", "meta-badge", label));
      }
      item.appendChild(scopes);
    }
    for (const text of validationGroupBodyTexts(group)) {
      item.appendChild(textNode("p", "", text));
    }
    list.appendChild(item);
  }
}

function renderValidationMessages(messages, { context = {}, groupAction = null } = {}) {
  const list = document.createElement("div");
  list.className = "validation-list validation-list-compact";
  appendGroupedMessages(list, messages, context, groupAction);
  return list;
}

export {
  appendGroupedMessages,
  renderValidationMessages,
  validationGroupBodyTexts,
  validationGroupTitle,
  validationSeverityLabel,
  validationSeverityMarker,
};
