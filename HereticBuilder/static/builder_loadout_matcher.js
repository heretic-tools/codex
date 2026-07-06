import { loadoutChoiceSets } from "./builder_loadout_catalog.js";
import { cleanCounts, countsEqual } from "./builder_loadout_counts.js";
import { validLoadoutsFromChoiceSets } from "./builder_loadout_choices.js";
import { canPartitionLoadouts } from "./builder_loadout_partition.js";

function wargearLoadoutMatchesChoiceSets(datasheetId, miniatureId, selectedCounts, modelCount) {
  const selected = cleanCounts(selectedCounts);
  const sets = loadoutChoiceSets(datasheetId, miniatureId);
  if (!sets.length) {
    return !Object.keys(selected).length;
  }
  const validLoadouts = validLoadoutsFromChoiceSets(sets);
  if (modelCount <= 1) {
    return validLoadouts.some((loadout) => countsEqual(loadout, selected));
  }
  return canPartitionLoadouts(selected, validLoadouts, modelCount);
}

export { wargearLoadoutMatchesChoiceSets };
