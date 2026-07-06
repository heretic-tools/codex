import {
  refreshRosters,
  rosterWithFreshListCache,
} from "./builder_roster_runtime.js";
import { saveRoster } from "./builder_storage.js";

async function saveImportedRosters(rosters, validateRoster) {
  for (const roster of rosters) {
    await saveRoster(rosterWithFreshListCache(roster, validateRoster(roster)));
  }
  await refreshRosters();
}

export { saveImportedRosters };
