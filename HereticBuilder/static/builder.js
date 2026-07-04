import { loadBootstrap, loadCatalog } from "./builder_catalog.js";
import { clear } from "./builder_dom.js";
import { renderNotFoundView } from "./builder_not_found_view.js";
import { baseBreadcrumbs, builderBreadcrumbs, navigate, parseRoute } from "./builder_routes.js";
import { renderRosterCreateView } from "./builder_roster_create_view.js";
import { renderRosterDetailView } from "./builder_roster_detail_view.js";
import { renderRosterListView } from "./builder_roster_list_view.js";
import { el, renderBreadcrumbs, renderStartupError, setStatus } from "./builder_shell.js";
import { state } from "./builder_state.js";
import { getAllRosters, newId, openLocalDb, removeRoster, saveRoster } from "./builder_storage.js";

let catalogPromise = null;
let rulesPromise = null;

function currentRoster() {
  return state.rosters.find((roster) => roster.id === state.route.rosterId) || null;
}

function routeRoster(route) {
  return state.rosters.find((roster) => roster.id === route.rosterId) || null;
}

function catalogIsFull() {
  return Boolean(state.catalog?.datasheetById);
}

function routeNeedsFullCatalog(route) {
  if (route.name === "roster") {
    return Boolean(routeRoster(route));
  }
  return route.name === "list" && state.rosters.length > 0;
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

function loadRules() {
  if (!rulesPromise) {
    rulesPromise = import("./builder_rules.js");
  }
  return rulesPromise;
}

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

async function refreshRosters() {
  state.rosters = (await getAllRosters()).sort((left, right) => (
    String(right.modifiedAt || "").localeCompare(String(left.modifiedAt || ""))
    || String(left.name || "").localeCompare(String(right.name || ""))
  ));
}

async function renderList() {
  el.title.textContent = "Builder";
  renderBreadcrumbs(baseBreadcrumbs());
  const rules = state.rosters.length ? await loadRules() : {};
  el.root.appendChild(renderRosterListView({
    rosters: state.rosters,
    onCreate: () => navigate("/new"),
    onOpen: (roster) => navigate(`/roster/${encodeURIComponent(roster.id)}`),
    summarizeRoster: rules.rosterSummary,
    validateRoster: rules.validateRoster,
  }));
}

async function createRoster(values) {
  const now = new Date().toISOString();
  const roster = {
    id: newId(),
    name: values.name,
    factionKeywordId: values.factionKeywordId,
    battleSizeId: values.battleSizeId,
    detachmentIds: [],
    units: [],
    attachments: [],
    createdAt: now,
    modifiedAt: now,
    dataVersion: state.catalog.bootstrap.dataVersion,
  };
  await saveRoster(roster);
  await refreshRosters();
  navigate(`/roster/${encodeURIComponent(roster.id)}`);
}

function renderCreate() {
  el.title.textContent = "Create Roster";
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterCreateView({
    battleSizes: state.catalog.battleSizes,
    defaultBattleSizeId: state.catalog.bootstrap.defaultBattleSizeId,
    defaultFactionId: state.catalog.bootstrap.defaultFactionId,
    factions: state.catalog.factions,
    onBack: () => navigate("/"),
    onSubmit: createRoster,
  }));
}

async function deleteRoster(roster) {
  if (window.confirm(`Delete ${roster.name || "this roster"}?`)) {
    await removeRoster(roster.id);
    await refreshRosters();
    navigate("/");
  }
}

async function renderRoster() {
  const roster = currentRoster();
  if (!roster) {
    renderNotFound();
    return;
  }
  const { rosterSummary, validateRoster } = await loadRules();
  el.title.textContent = roster.name || "New Roster";
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterDetailView({
    roster,
    onDelete: deleteRoster,
    summarizeRoster: rosterSummary,
    validateRoster,
  }));
}

function renderNotFound() {
  el.title.textContent = "Builder";
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderNotFoundView({
    onBack: () => navigate("/"),
  }));
}

async function render() {
  clear(el.root);
  if (state.route.name === "create") {
    renderCreate();
  } else if (state.route.name === "roster") {
    await renderRoster();
  } else {
    await renderList();
  }
  window.requestAnimationFrame(() => window.setupWinScrollbars?.());
}

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
