import { clear } from "./builder_dom.js";
import { renderCreate, renderList } from "./builder_route_basic_renderers.js";
import { renderNotFound, renderRoster, renderUnit } from "./builder_route_roster_renderers.js";
import { el, renderStartupError } from "./builder_shell.js";
import { state } from "./builder_state.js";
import { ensureCatalog, routeNeedsFullCatalog } from "./builder_catalog_runtime.js";

async function setRoute(route) {
  state.route = route;
  try {
    if (routeNeedsFullCatalog(route)) {
      await ensureCatalog();
    }
    await render();
  } catch (error) {
    renderStartupError(error);
  }
}

async function render() {
  clear(el.root);
  if (state.route.name === "create") {
    await renderCreate();
  } else if (state.route.name === "unit") {
    await renderUnit(render);
  } else if (state.route.name === "roster") {
    await renderRoster(render);
  } else if (state.route.name === "notFound") {
    await renderNotFound();
  } else {
    await renderList(render);
  }
  window.requestAnimationFrame(() => window.setupWinScrollbars?.());
}

export {
  render,
  setRoute,
};
