import {
  loadRules,
  loadTransfer,
} from "./builder_module_loaders.js";
import { navigate } from "./builder_routes.js";
import {
  currentDataVersion,
  refreshRosters,
  rosterWithFreshListCache,
} from "./builder_roster_runtime.js";
import { ensureCatalog } from "./builder_catalog_runtime.js";
import { state } from "./builder_state.js";
import { newId, removeRoster, saveRoster } from "./builder_storage.js";

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

async function deleteRoster(roster) {
  if (window.confirm(`Delete ${roster.name || "this roster"}?`)) {
    await removeRoster(roster.id);
    await refreshRosters();
    navigate("/");
  }
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
  exportRosters,
  importRosters,
  updateRoster,
};
