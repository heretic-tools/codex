import { loadDetailView, loadRules } from "./builder_module_loaders.js";
import { builderBreadcrumbs, navigate } from "./builder_routes.js";
import { el, renderBreadcrumbs, setPageTitle } from "./builder_shell.js";
import { state } from "./builder_state.js";
import { newId } from "./builder_storage.js";
import {
  currentRoster,
  saveRosterCacheIfStale,
} from "./builder_roster_runtime.js";
import {
  deleteRoster,
  duplicateRoster,
  updateRoster,
} from "./builder_roster_io_actions.js";
import { renderNotFound } from "./builder_route_not_found_renderer.js";
import { updateRosterWithUndo } from "./builder_roster_update_with_undo.js";

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
  setPageTitle(roster.name || "New Roster");
  renderBreadcrumbs(builderBreadcrumbs());
  el.root.appendChild(renderRosterDetailView({
    focusTarget: state.route.focusTarget || "",
    newId,
    roster,
    onDelete: deleteRoster,
    onDuplicate: duplicateRoster,
    onUpdate: (nextRoster) => updateRoster(nextRoster, render),
    onUndoableUpdate: ({ message, nextRoster, previousRoster }) => updateRosterWithUndo({
      message,
      nextRoster,
      previousRoster,
      render,
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

export { renderRoster };
