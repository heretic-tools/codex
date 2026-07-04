import { button, textNode } from "./builder_dom.js";

function renderNotFoundView({ onBack }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.append(
    textNode("h2", "section-title", "Roster Not Found"),
    button("plain-button", "Back to Builder", onBack)
  );
  return root;
}

export { renderNotFoundView };
