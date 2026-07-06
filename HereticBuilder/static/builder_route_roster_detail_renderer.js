import { loadDetailView, loadRules } from "./builder_module_loaders.js";
import { builderBreadcrumbs, navigate } from "./builder_routes.js";
import { el, renderBreadcrumbs } from "./builder_shell.js";
import { newId } from "./builder_storage.js";
import {
  currentRoster,
  saveRosterCacheIfStale,
} from "./builder_roster_runtime.js";
import {
  deleteRoster,
  updateRoster,
} from "./builder_roster_io_actions.js";
import { renderNotFound } from "./builder_route_not_found_renderer.js";
import { showUndoToast } from "./builder_toast.js";

async function updateRosterWithUndo({ nextRoster, previousRoster, render, unit }) {
  await updateRoster(nextRoster, render);
  showUndoToast({
    message: `${unit?.name || "Unit"} removed`,
    onUndo: () => updateRoster(previousRoster, render),
  });
}

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
  const {
    ensurePrecomputedLoadoutsForDatasheets,
    rosterDatasheetIds,
  } = await import("./builder_precomputed_loadouts_runtime.js");
  await ensurePrecomputedLoadoutsForDatasheets(rosterDatasheetIds(roster));
  const validation = validateRoster(roster);
  await saveRosterCacheIfStale(roster, validation);
  el.title.textContent = roster.name || "New Roster";
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterDetailView({
    newId,
    roster,
    onDelete: deleteRoster,
    onUpdate: (nextRoster) => updateRoster(nextRoster, render),
    onUnitRemove: ({ nextRoster, previousRoster, unit }) => updateRosterWithUndo({
      nextRoster,
      previousRoster,
      render,
      unit,
    }),
    onUnitOpen: (unit, focusTarget = "") => {
      const unitPath = `/roster/${encodeURIComponent(roster.id)}/unit/${encodeURIComponent(unit.id)}`;
      navigate(focusTarget ? `${unitPath}/focus/${encodeURIComponent(focusTarget)}` : unitPath);
    },
    summarizeRoster: rosterSummary,
    validation,
    validateRoster,
  }));
}

export { renderRoster, updateRosterWithUndo };
