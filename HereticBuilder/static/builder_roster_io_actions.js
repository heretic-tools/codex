import { loadRules } from "./builder_module_loaders.js";
import { navigate } from "./builder_routes.js";
import {
  refreshRosters,
  rosterWithFreshListCache,
} from "./builder_roster_runtime.js";
import { state } from "./builder_state.js";
import { newId, removeRoster, saveRoster } from "./builder_storage.js";
export {
  exportRosters,
  importRosters,
} from "./builder_roster_transfer_actions.js";

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
  updateRoster,
};
