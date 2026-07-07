import { loadRules } from "./builder_module_loaders.js";
import { navigate } from "./builder_routes.js";
import {
  refreshRosters,
  rosterWithFreshListCache,
} from "./builder_roster_runtime.js";
import { duplicateRosterDocument } from "./builder_roster_clone.js";
import { newRosterDocument } from "./builder_roster_create_model.js";
import { state } from "./builder_state.js";
import { newId, removeRoster, saveRoster } from "./builder_storage.js";
export {
  exportRoster,
  exportRosterText,
  exportRosters,
  importRosters,
} from "./builder_roster_transfer_actions.js";

async function createRoster(values) {
  const now = new Date().toISOString();
  const roster = newRosterDocument(values, {
    dataVersion: state.catalog.bootstrap.dataVersion,
    id: newId(),
    now,
  });
  await saveRoster(roster);
  await refreshRosters();
  navigate(`/roster/${encodeURIComponent(roster.id)}`);
}

function shouldRenderAfterDelete(roster) {
  const rosterId = roster?.id;
  if (!rosterId) {
    return false;
  }
  if (state.route.name === "roster" || state.route.name === "unit") {
    return state.route.rosterId !== rosterId;
  }
  return state.route.name === "list";
}

async function deleteRoster(roster, render = null) {
  await removeRoster(roster.id);
  await refreshRosters();
  if (render && shouldRenderAfterDelete(roster)) {
    await render();
  } else {
    navigate("/");
  }
  const { showUndoToast } = await import("./builder_toast.js");
  showUndoToast({
    message: `${roster.name || "Roster"} deleted`,
    onUndo: () => restoreRoster(roster),
  });
}

async function duplicateRoster(roster) {
  const { validateRoster } = await loadRules();
  const copy = duplicateRosterDocument(roster, {
    id: newId(),
    now: new Date().toISOString(),
  });
  await saveRoster(rosterWithFreshListCache(copy, validateRoster(copy)));
  await refreshRosters();
  navigate(`/roster/${encodeURIComponent(copy.id)}`);
}

async function restoreRoster(roster) {
  const { validateRoster } = await loadRules();
  await saveRoster(rosterWithFreshListCache(roster, validateRoster(roster)));
  await refreshRosters();
  navigate(`/roster/${encodeURIComponent(roster.id)}`);
}

async function updateRoster(roster, render) {
  const { validateRoster } = await loadRules();
  await saveRoster(rosterWithFreshListCache(roster, validateRoster(roster)));
  await refreshRosters();
  await render();
}

export {
  createRoster,
  deleteRoster,
  duplicateRoster,
  restoreRoster,
  shouldRenderAfterDelete,
  updateRoster,
};
