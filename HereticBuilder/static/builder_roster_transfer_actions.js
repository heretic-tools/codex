import {
  loadRules,
  loadTransfer,
} from "./builder_module_loaders.js";
import {
  currentDataVersion,
  refreshRosters,
  rosterWithFreshListCache,
} from "./builder_roster_runtime.js";
import { ensureCatalog } from "./builder_catalog_runtime.js";
import { state } from "./builder_state.js";
import { newId, saveRoster } from "./builder_storage.js";

async function exportRosters() {
  try {
    const { serializeRosters } = await loadTransfer();
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
  } catch (error) {
    window.alert(error.message || "Failed to export rosters");
  }
}

async function importRosters(file, render) {
  try {
    const { parseImportedRosters, rostersWithNonConflictingIds } = await loadTransfer();
    const rosters = rostersWithNonConflictingIds(
      parseImportedRosters(await file.text()),
      state.rosters.map((roster) => roster.id),
      newId
    );
    if (!rosters.length) {
      return;
    }
    await ensureCatalog();
    const { validateRoster } = await loadRules();
    for (const roster of rosters) {
      await saveRoster(rosterWithFreshListCache(roster, validateRoster(roster)));
    }
    await refreshRosters();
    await render();
  } catch (error) {
    window.alert(error.message || "Failed to import rosters");
  }
}

export {
  exportRosters,
  importRosters,
};
