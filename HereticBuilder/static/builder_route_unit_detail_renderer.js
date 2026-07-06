import { loadRules, loadUnitView } from "./builder_module_loaders.js";
import { builderBreadcrumbs, navigate } from "./builder_routes.js";
import { el, renderBreadcrumbs } from "./builder_shell.js";
import { state } from "./builder_state.js";
import {
  currentRoster,
  saveRosterCacheIfStale,
} from "./builder_roster_runtime.js";
import { updateRoster } from "./builder_roster_io_actions.js";
import { renderNotFound } from "./builder_route_not_found_renderer.js";
import { updateRosterWithUndo } from "./builder_roster_update_with_undo.js";

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
  const {
    ensurePrecomputedLoadoutsForDatasheets,
    rosterDatasheetIds,
  } = await import("./builder_precomputed_loadouts_runtime.js");
  await ensurePrecomputedLoadoutsForDatasheets(rosterDatasheetIds(roster));
  const validation = validateRoster(roster);
  await saveRosterCacheIfStale(roster, validation);
  el.title.textContent = unitDisplayName(roster, unit);
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterUnitDetailView({
    focusTarget: state.route.focusTarget || "",
    onBack: () => navigate(`/roster/${encodeURIComponent(roster.id)}`),
    onUpdate: (nextRoster) => updateRoster(nextRoster, render),
    onUndoableUpdate: ({ message, nextRoster, previousRoster }) => updateRosterWithUndo({
      message,
      nextRoster,
      previousRoster,
      render,
    }),
    roster,
    unit,
    validation,
  }));
}

export { renderUnit };
