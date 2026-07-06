import { loadRules } from "./builder_module_loaders.js";
import { navigate } from "./builder_routes.js";
import {
  refreshRosters,
  rosterWithFreshListCache,
} from "./builder_roster_runtime.js";
import { newRosterDocument } from "./builder_roster_create_model.js";
import { state } from "./builder_state.js";
import { newId, removeRoster, saveRoster } from "./builder_storage.js";
export {
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

async function deleteRoster(roster) {
  await removeRoster(roster.id);
  await refreshRosters();
  navigate("/");
  const { showUndoToast } = await import("./builder_toast.js");
  showUndoToast({
    message: `${roster.name || "Roster"} deleted`,
    onUndo: () => restoreRoster(roster),
  });
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
  restoreRoster,
  updateRoster,
};
