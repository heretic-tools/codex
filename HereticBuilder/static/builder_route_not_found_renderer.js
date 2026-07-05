import { loadNotFoundView } from "./builder_module_loaders.js";
import { builderBreadcrumbs, navigate } from "./builder_routes.js";
import { el, renderBreadcrumbs } from "./builder_shell.js";

async function renderNotFound() {
  el.title.textContent = "Builder";
  renderBreadcrumbs(builderBreadcrumbs());
  const { renderNotFoundView } = await loadNotFoundView();
  el.root.appendChild(renderNotFoundView({
    onBack: () => navigate("/"),
  }));
}

export { renderNotFound };
