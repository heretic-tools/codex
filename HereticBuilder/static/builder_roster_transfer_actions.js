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
import { showStatusToast } from "./builder_toast.js";

async function exportRosters() {
  try {
    const { serializeRosters } = await loadTransfer();
    const payload = serializeRosters(state.rosters, currentDataVersion());
    downloadRosterExport(payload);
    showStatusToast({ message: "Roster export ready", tone: "success" });
  } catch (error) {
    showStatusToast({ message: error.message || "Failed to export rosters", tone: "error" });
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
      showStatusToast({ message: "No rosters found in import file" });
      return;
    }
    await ensureCatalog();
    const { validateRoster } = await loadRules();
    await saveImportedRosters(rosters, validateRoster);
    await render();
    showStatusToast({ message: `${rosters.length} roster${rosters.length === 1 ? "" : "s"} imported`, tone: "success" });
  } catch (error) {
    showStatusToast({ message: error.message || "Failed to import rosters", tone: "error" });
  }
}

export {
  exportRosters,
  importRosters,
};
