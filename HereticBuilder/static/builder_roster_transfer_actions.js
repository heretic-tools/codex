import {
  loadRules,
  loadTransfer,
} from "./builder_module_loaders.js";
import { currentDataVersion } from "./builder_roster_runtime.js";
import { ensureCatalog } from "./builder_catalog_runtime.js";
import { downloadRosterExport } from "./builder_roster_export_download.js";
import { saveImportedRosters } from "./builder_roster_import_save.js";
import { state } from "./builder_state.js";
import { newId } from "./builder_storage.js";

async function exportRosters() {
  try {
    const { serializeRosters } = await loadTransfer();
    const payload = serializeRosters(state.rosters, currentDataVersion());
    downloadRosterExport(payload);
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
    await saveImportedRosters(rosters, validateRoster);
    await render();
  } catch (error) {
    window.alert(error.message || "Failed to import rosters");
  }
}

export {
  exportRosters,
  importRosters,
};
