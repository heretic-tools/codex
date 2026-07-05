import { loadBootstrap } from "./builder_catalog.js";
import { parseRoute } from "./builder_routes.js";
import { setRoute } from "./builder_route_renderers.js";
import { renderStartupError, setStatus } from "./builder_shell.js";
import { state } from "./builder_state.js";
import { openLocalDb } from "./builder_storage.js";
import { refreshRosters } from "./builder_roster_runtime.js";

async function init() {
  try {
    setStatus("Data");
    state.catalog = await loadBootstrap();
    setStatus(`v${state.catalog.bootstrap.dataVersion}`);
    state.db = await openLocalDb();
    await refreshRosters();
    await setRoute(parseRoute());
    window.addEventListener("hashchange", () => setRoute(parseRoute()));
  } catch (error) {
    renderStartupError(error);
  }
}

init();
