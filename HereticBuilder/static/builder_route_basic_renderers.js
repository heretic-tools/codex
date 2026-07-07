import {
  loadCreateView,
  loadListView,
} from "./builder_module_loaders.js";
import { baseBreadcrumbs, builderBreadcrumbs, navigate } from "./builder_routes.js";
import { el, renderBreadcrumbs, setPageTitle } from "./builder_shell.js";
import { state } from "./builder_state.js";
import { lightweightRosterSummary } from "./builder_roster_runtime.js";
import {
  createRoster,
  exportRosters,
  importRosters,
} from "./builder_roster_io_actions.js";

async function renderList(render) {
  setPageTitle("Builder");
  renderBreadcrumbs(baseBreadcrumbs());
  const { renderRosterListView } = await loadListView();
  el.root.appendChild(renderRosterListView({
    onCreate: () => navigate("/new"),
    onExport: exportRosters,
    onImport: (file) => importRosters(file, render),
    onOpen: (roster) => navigate(`/roster/${encodeURIComponent(roster.id)}`),
    rosters: state.rosters,
    summarizeRoster: lightweightRosterSummary,
  }));
}

async function renderCreate() {
  setPageTitle("Create Roster");
  renderBreadcrumbs(builderBreadcrumbs());
  const { renderRosterCreateView } = await loadCreateView();
  el.root.appendChild(renderRosterCreateView({
    battleSizes: state.catalog.battleSizes,
    defaultBattleSizeId: state.catalog.bootstrap.defaultBattleSizeId,
    defaultFactionId: state.catalog.bootstrap.defaultFactionId,
    factions: state.catalog.factions,
    onSubmit: createRoster,
    rosters: state.rosters,
  }));
}

export {
  renderCreate,
  renderList,
};
