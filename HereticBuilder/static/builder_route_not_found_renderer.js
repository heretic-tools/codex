import { loadNotFoundView } from "./builder_module_loaders.js";
import { builderBreadcrumbs } from "./builder_routes.js";
import { el, renderBreadcrumbs, setPageTitle } from "./builder_shell.js";

async function renderNotFound({
  breadcrumbs = builderBreadcrumbs(),
  message = "This roster or unit is no longer available.",
  title = "Roster Not Found",
} = {}) {
  setPageTitle(title);
  renderBreadcrumbs(breadcrumbs);
  const { renderNotFoundView } = await loadNotFoundView();
  el.root.appendChild(renderNotFoundView({ message, title }));
}

export { renderNotFound };
