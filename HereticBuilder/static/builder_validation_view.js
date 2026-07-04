import { textNode } from "./builder_dom.js";

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

function groupedMessages(messages) {
  const groups = new Map();
  for (const message of messages) {
    const key = `${message.level || "error"}:${message.code || "unknown"}`;
    if (!groups.has(key)) {
      groups.set(key, { code: message.code || "unknown", level: message.level || "error", count: 0, texts: [] });
    }
    const group = groups.get(key);
    group.count += 1;
    if (!group.texts.includes(message.text)) {
      group.texts.push(message.text);
    }
  }
  return [...groups.values()].sort((left, right) => (
    left.level.localeCompare(right.level) || left.code.localeCompare(right.code)
  ));
}

function renderValidation(validation) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section";
  wrap.appendChild(textNode("h2", "section-title", "Validation"));
  const list = document.createElement("div");
  list.className = "validation-list";
  list.appendChild(textNode(
    "div",
    `validation-item validation-summary ${validation.messages.some((message) => message.level === "error") ? "error" : "ok"}`,
    validationSummary(validation)
  ));
  for (const group of groupedMessages(validation.messages)) {
    const item = textNode("div", `validation-item ${group.level}`, "");
    const head = document.createElement("div");
    head.className = "validation-row-head";
    head.append(
      textNode("strong", "", group.code),
      textNode("span", "validation-count", String(group.count))
    );
    item.appendChild(head);
    for (const text of group.texts) {
      item.appendChild(textNode("p", "", text));
    }
    list.appendChild(item);
  }
  wrap.appendChild(list);
  return wrap;
}

export { renderValidation };
