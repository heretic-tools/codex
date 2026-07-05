import { loadCatalog } from "./builder_catalog.js";
import { routeRoster } from "./builder_roster_runtime.js";
import { setStatus } from "./builder_shell.js";
import { state } from "./builder_state.js";

let catalogPromise = null;

function catalogIsFull() {
  return Boolean(state.catalog?.datasheetById);
}

function routeNeedsFullCatalog(route) {
  if (route.name === "roster" || route.name === "unit") {
    return Boolean(routeRoster(route));
  }
  return false;
}

async function ensureCatalog() {
  if (catalogIsFull()) {
    return state.catalog;
  }
  if (!catalogPromise) {
    setStatus("Rules");
    catalogPromise = loadCatalog(state.catalog?.bootstrap || null)
      .then((catalog) => {
        state.catalog = catalog;
        setStatus(`v${catalog.bootstrap.dataVersion}`);
        return catalog;
      })
      .catch((error) => {
        catalogPromise = null;
        throw error;
      });
  }
  return catalogPromise;
}

export {
  ensureCatalog,
  routeNeedsFullCatalog,
};
