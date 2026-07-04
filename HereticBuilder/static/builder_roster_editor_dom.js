import { button, textNode } from "./builder_dom.js";

function dispositionSlug(name) {
  return String(name || "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sectionTitle(label, meta = "") {
  const node = document.createElement("div");
  node.className = "builder-section-head";
  node.append(textNode("h2", "section-title", label));
  if (meta) {
    node.append(textNode("span", "section-meta", meta));
  }
  return node;
}

function emptyMessage(text) {
  return textNode("p", "empty-list", text);
}

function removeButton(label, onClick) {
  const node = button("remove-button", "x", onClick);
  node.title = label;
  node.setAttribute("aria-label", label);
  return node;
}

export {
  dispositionSlug,
  emptyMessage,
  removeButton,
  sectionTitle,
};
