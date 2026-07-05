import { clear } from "./builder_dom.js";
import {
  loadCreateView,
  loadDetailView,
  loadListView,
  loadNotFoundView,
  loadRules,
  loadUnitView,
} from "./builder_module_loaders.js";
import { baseBreadcrumbs, builderBreadcrumbs, navigate } from "./builder_routes.js";
import { el, renderBreadcrumbs, renderStartupError } from "./builder_shell.js";
import { state } from "./builder_state.js";
import { newId } from "./builder_storage.js";
import {
  currentRoster,
  lightweightRosterSummary,
  saveRosterCacheIfStale,
} from "./builder_roster_runtime.js";
import {
  createRoster,
  deleteRoster,
  exportRosters,
  importRosters,
  updateRoster,
} from "./builder_roster_io_actions.js";
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

async function renderList() {
  el.title.textContent = "Builder";
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
  el.title.textContent = "Create Roster";
  renderBreadcrumbs(builderBreadcrumbs());
  const { renderRosterCreateView } = await loadCreateView();
  el.root.appendChild(renderRosterCreateView({
    battleSizes: state.catalog.battleSizes,
    defaultBattleSizeId: state.catalog.bootstrap.defaultBattleSizeId,
    defaultFactionId: state.catalog.bootstrap.defaultFactionId,
    factions: state.catalog.factions,
    onBack: () => navigate("/"),
    onSubmit: createRoster,
  }));
}

async function renderRoster() {
  const roster = currentRoster();
  if (!roster) {
    await renderNotFound();
    return;
  }
  const [{ renderRosterDetailView }, { rosterSummary, validateRoster }] = await Promise.all([
    loadDetailView(),
    loadRules(),
  ]);
  const validation = validateRoster(roster);
  await saveRosterCacheIfStale(roster, validation);
  el.title.textContent = roster.name || "New Roster";
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterDetailView({
    newId,
    roster,
    onDelete: deleteRoster,
    onUpdate: (nextRoster) => updateRoster(nextRoster, render),
    onUnitOpen: (unit) => navigate(`/roster/${encodeURIComponent(roster.id)}/unit/${encodeURIComponent(unit.id)}`),
    summarizeRoster: rosterSummary,
    validation,
    validateRoster,
  }));
}

async function renderUnit() {
  const roster = currentRoster();
  const unit = roster?.units?.find((item) => item.id === state.route.unitId);
  if (!roster || !unit) {
    await renderNotFound();
    return;
  }
  const [{ renderRosterUnitDetailView, unitDisplayName }, { validateRoster }] = await Promise.all([
    loadUnitView(),
    loadRules(),
  ]);
  const validation = validateRoster(roster);
  await saveRosterCacheIfStale(roster, validation);
  el.title.textContent = unitDisplayName(roster, unit);
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterUnitDetailView({
    onBack: () => navigate(`/roster/${encodeURIComponent(roster.id)}`),
    onUpdate: (nextRoster) => updateRoster(nextRoster, render),
    roster,
    unit,
    validation,
  }));
}

async function renderNotFound() {
  el.title.textContent = "Builder";
  renderBreadcrumbs(builderBreadcrumbs());
  const { renderNotFoundView } = await loadNotFoundView();
  el.root.appendChild(renderNotFoundView({
    onBack: () => navigate("/"),
  }));
}

async function render() {
  clear(el.root);
  if (state.route.name === "create") {
    await renderCreate();
  } else if (state.route.name === "unit") {
    await renderUnit();
  } else if (state.route.name === "roster") {
    await renderRoster();
  } else {
    await renderList();
  }
  window.requestAnimationFrame(() => window.setupWinScrollbars?.());
}

export {
  render,
  setRoute,
};
