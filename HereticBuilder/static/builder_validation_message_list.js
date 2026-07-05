import { textNode } from "./builder_dom.js";
import { groupedMessages } from "./builder_validation_groups.js";

function validationCounts(messages) {
  return messages.reduce((counts, message) => {
    counts[message.level] = (counts[message.level] || 0) + 1;
    return counts;
  }, {});
}

function validationSummary(validation) {
  if (!validation.messages.length) {
    return "Valid";
  }
  const counts = validationCounts(validation.messages);
  const parts = [];
  if (counts.error) {
    parts.push(`${counts.error} error${counts.error === 1 ? "" : "s"}`);
  }
  if (counts.warning) {
    parts.push(`${counts.warning} warning${counts.warning === 1 ? "" : "s"}`);
  }
  return `${validation.state === "valid" ? "Valid" : "Invalid"} / ${parts.join(" / ")}`;
}

function appendGroupedMessages(list, messages, context = {}, groupAction = null) {
  for (const group of groupedMessages(messages, context)) {
    const item = textNode("div", `validation-item ${group.level}`, "");
    const head = document.createElement("div");
    head.className = "validation-row-head";
    const action = groupAction?.(group);
    head.append(
      textNode("strong", "", group.code),
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
    for (const text of group.texts) {
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
  validationSummary,
};
