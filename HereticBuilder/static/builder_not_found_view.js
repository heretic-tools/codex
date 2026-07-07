import { textNode } from "./builder_dom.js";

function renderNotFoundView() {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.append(
    textNode("h2", "section-title", "Roster Not Found"),
    textNode("p", "empty-list", "This roster or unit is no longer available.")
  );
  return root;
}

export { renderNotFoundView };
