import { loadNotFoundView } from "./builder_module_loaders.js";
import { builderBreadcrumbs } from "./builder_routes.js";
import { el, renderBreadcrumbs, setPageTitle } from "./builder_shell.js";

async function renderNotFound() {
  setPageTitle("Builder");
  renderBreadcrumbs(builderBreadcrumbs());
  const { renderNotFoundView } = await loadNotFoundView();
  el.root.appendChild(renderNotFoundView());
}

export { renderNotFound };
