import {
  loadDetailView,
  loadNotFoundView,
  loadRules,
  loadUnitView,
} from "./builder_module_loaders.js";
import { builderBreadcrumbs, navigate } from "./builder_routes.js";
import { el, renderBreadcrumbs } from "./builder_shell.js";
import { state } from "./builder_state.js";
import { newId } from "./builder_storage.js";
import {
  currentRoster,
  saveRosterCacheIfStale,
} from "./builder_roster_runtime.js";
import {
  deleteRoster,
  updateRoster,
} from "./builder_roster_io_actions.js";

async function renderRoster(render) {
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

async function renderUnit(render) {
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

export {
  renderNotFound,
  renderRoster,
  renderUnit,
};
