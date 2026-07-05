import { loadBootstrap, loadCatalog } from "./builder_catalog.js";
import { clear } from "./builder_dom.js";
import { baseBreadcrumbs, builderBreadcrumbs, navigate, parseRoute } from "./builder_routes.js";
import { el, renderBreadcrumbs, renderStartupError, setStatus } from "./builder_shell.js";
import { state } from "./builder_state.js";
import { getAllRosters, newId, openLocalDb, removeRoster, saveRoster } from "./builder_storage.js";
import {
  rosterCachedPointsTotal,
  rosterListCacheIsFresh,
  rosterWithListCache,
} from "./builder_roster_cache.js";
import { parseImportedRosters, serializeRosters } from "./builder_roster_transfer.js";

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

function lightweightRosterSummary(roster) {
  const faction = bootstrapRowById(state.catalog.factions, roster.factionKeywordId);
  const battleSize = bootstrapRowById(state.catalog.battleSizes, roster.battleSizeId);
  const cacheFresh = rosterListCacheIsFresh(roster, currentDataVersion());
  return {
    battleSizeName: battleSize?.name || "Unknown Battle Size",
    detachmentCount: (roster.detachmentIds || []).length,
    factionName: faction?.name || "Unknown Faction",
    pointsLimit: battleSize?.pointsLimit || 0,
    pointsTotal: rosterCachedPointsTotal(roster),
    validationState: cacheFresh ? roster.listSummary.validationState : "outdated",
    unitCount: (roster.units || []).length,
  };
}

function currentDataVersion() {
  return state.catalog?.bootstrap?.dataVersion || null;
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

async function saveRosterCacheIfStale(roster, validation) {
  const dataVersion = currentDataVersion();
  if (rosterListCacheIsFresh(roster, dataVersion)) {
    return;
  }
  await saveRoster(rosterWithListCache(roster, validation, dataVersion), { touch: false });
  await refreshRosters();
}

async function renderList() {
  el.title.textContent = "Builder";
  renderBreadcrumbs(baseBreadcrumbs());
  const { renderRosterListView } = await loadListView();
  el.root.appendChild(renderRosterListView({
    onCreate: () => navigate("/new"),
    onExport: exportRosters,
    onImport: importRosters,
    onOpen: (roster) => navigate(`/roster/${encodeURIComponent(roster.id)}`),
    rosters: state.rosters,
    summarizeRoster: lightweightRosterSummary,
  }));
}

function exportRosters() {
  const payload = serializeRosters(state.rosters, currentDataVersion());
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `heretic-builder-rosters-${new Date().toISOString().slice(0, 10)}.json`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importRosters(file) {
  try {
    const rosters = parseImportedRosters(await file.text());
    if (!rosters.length) {
      return;
    }
    await ensureCatalog();
    const { validateRoster } = await loadRules();
    for (const roster of rosters) {
      await saveRoster(rosterWithListCache(roster, validateRoster(roster), currentDataVersion()));
    }
    await refreshRosters();
    await render();
  } catch (error) {
    window.alert(error.message || "Failed to import rosters");
  }
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
    listSummary: {
      detachmentPoints: 0,
      pointsTotal: 0,
      validationState: "invalid",
    },
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
  const { validateRoster } = await loadRules();
  await saveRoster(rosterWithListCache(roster, validateRoster(roster), currentDataVersion()));
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
  const validation = validateRoster(roster);
  await saveRosterCacheIfStale(roster, validation);
  el.title.textContent = roster.name || "New Roster";
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterDetailView({
    newId,
    roster,
    onDelete: deleteRoster,
    onUpdate: updateRoster,
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
    onUpdate: updateRoster,
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
