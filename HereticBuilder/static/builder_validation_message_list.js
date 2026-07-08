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

function validationSeveritySymbol(level) {
  if (level === "warning") {
    return "!";
  }
  if (level === "ok") {
    return "OK";
  }
  return "X";
}

function validationSeverityMarker(level) {
  const marker = textNode("span", `validation-severity-marker ${level}`, "");
  const label = validationSeverityLabel(level);
  marker.title = label;
  if (marker.setAttribute) {
    marker.setAttribute("data-marker", validationSeveritySymbol(level));
    marker.setAttribute("aria-label", label);
  }
  return marker;
}

function validationCountLabel(count) {
  return `${count} issue${count === 1 ? "" : "s"}`;
}

function validationCountBadge(count) {
  const node = textNode("span", "validation-count", String(count));
  const label = validationCountLabel(count);
  node.title = label;
  if (node.setAttribute) {
    node.setAttribute("aria-label", label);
  }
  return node;
}

function appendGroupedMessages(list, messages, context = {}, groupAction = null) {
  for (const group of groupedMessages(messages, context)) {
    const item = textNode("div", `validation-item ${group.level}`, "");
    setValidationCode(item, group.code);
    if (item.setAttribute) {
      item.setAttribute("role", "listitem");
      item.setAttribute(
        "aria-label",
        `${validationSeverityLabel(group.level)}: ${validationGroupTitle(group)} (${validationCountLabel(group.count)})`
      );
    }
    const head = document.createElement("div");
    head.className = "validation-row-head";
    const action = groupAction?.(group);
    const titleWrap = document.createElement("span");
    titleWrap.className = "validation-title-wrap";
    const title = textNode("strong", "", validationGroupTitle(group));
    title.title = group.code;
    titleWrap.appendChild(title);
    const meta = document.createElement("span");
    meta.className = "validation-row-meta";
    if (group.count > 1) {
      meta.appendChild(validationCountBadge(group.count));
    }
    if (action) {
      meta.appendChild(action);
    }
    head.append(validationSeverityMarker(group.level), titleWrap, meta);
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
  if (list.setAttribute) {
    list.setAttribute("role", "list");
  }
  appendGroupedMessages(list, messages, context, groupAction);
  return list;
}

export {
  appendGroupedMessages,
  renderValidationMessages,
  validationGroupBodyTexts,
  validationGroupTitle,
  validationCountLabel,
  validationSeverityLabel,
  validationSeverityMarker,
  validationSeveritySymbol,
};
