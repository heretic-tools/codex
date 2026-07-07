import { textNode } from "./builder_dom.js";

function renderNotFoundView({
  message = "This roster or unit is no longer available.",
  title = "Roster Not Found",
} = {}) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.append(
    textNode("h2", "section-title", title),
    textNode("p", "empty-list", message)
  );
  return root;
}

export { renderNotFoundView };
