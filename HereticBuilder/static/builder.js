import { loadBootstrap, loadCatalog } from "./builder_catalog.js";
import { clear } from "./builder_dom.js";
import { baseBreadcrumbs, builderBreadcrumbs, navigate, parseRoute } from "./builder_routes.js";
import { el, renderBreadcrumbs, renderStartupError, setStatus } from "./builder_shell.js";
import { state } from "./builder_state.js";
import { getAllRosters, newId, openLocalDb, removeRoster, saveRoster } from "./builder_storage.js";

let catalogPromise = null;
let rulesPromise = null;
let createViewPromise = null;
let detailViewPromise = null;
let listViewPromise = null;
let notFoundViewPromise = null;
let unitViewPromise = null;

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

function loadRules() {
  if (!rulesPromise) {
    rulesPromise = import("./builder_rules.js");
  }
  return rulesPromise;
}

function loadCreateView() {
  if (!createViewPromise) {
    createViewPromise = import("./builder_roster_create_view.js");
  }
  return createViewPromise;
}

function loadDetailView() {
  if (!detailViewPromise) {
    detailViewPromise = import("./builder_roster_detail_view.js");
  }
  return detailViewPromise;
}

function loadListView() {
  if (!listViewPromise) {
    listViewPromise = import("./builder_roster_list_view.js");
  }
  return listViewPromise;
}

function loadNotFoundView() {
  if (!notFoundViewPromise) {
    notFoundViewPromise = import("./builder_not_found_view.js");
  }
  return notFoundViewPromise;
}

function loadUnitView() {
  if (!unitViewPromise) {
    unitViewPromise = import("./builder_roster_unit_detail_view.js");
  }
  return unitViewPromise;
}

function bootstrapRowById(rows, id) {
  return (rows || []).find((row) => row.id === id) || null;
}

function storedPointsTotal(roster) {
  return (roster.units || []).reduce((total, unit) => total + (unit.points || 0), 0);
}

function lightweightRosterSummary(roster) {
  const faction = bootstrapRowById(state.catalog.factions, roster.factionKeywordId);
  const battleSize = bootstrapRowById(state.catalog.battleSizes, roster.battleSizeId);
  return {
    battleSizeName: battleSize?.name || "Unknown Battle Size",
    detachmentCount: (roster.detachmentIds || []).length,
    factionName: faction?.name || "Unknown Faction",
    pointsLimit: battleSize?.pointsLimit || 0,
    pointsTotal: storedPointsTotal(roster),
    unitCount: (roster.units || []).length,
  };
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
  const { renderRosterListView } = await loadListView();
  el.root.appendChild(renderRosterListView({
    rosters: state.rosters,
    onCreate: () => navigate("/new"),
    onOpen: (roster) => navigate(`/roster/${encodeURIComponent(roster.id)}`),
    summarizeRoster: lightweightRosterSummary,
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

async function deleteRoster(roster) {
  if (window.confirm(`Delete ${roster.name || "this roster"}?`)) {
    await removeRoster(roster.id);
    await refreshRosters();
    navigate("/");
  }
}

async function updateRoster(roster) {
  await saveRoster(roster);
  await refreshRosters();
  await render();
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
  el.title.textContent = roster.name || "New Roster";
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterDetailView({
    newId,
    roster,
    onDelete: deleteRoster,
    onUpdate: updateRoster,
    onUnitOpen: (unit) => navigate(`/roster/${encodeURIComponent(roster.id)}/unit/${encodeURIComponent(unit.id)}`),
    summarizeRoster: rosterSummary,
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
  const { renderRosterUnitDetailView, unitDisplayName } = await loadUnitView();
  el.title.textContent = unitDisplayName(roster, unit);
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterUnitDetailView({
    onBack: () => navigate(`/roster/${encodeURIComponent(roster.id)}`),
    onUpdate: updateRoster,
    roster,
    unit,
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
