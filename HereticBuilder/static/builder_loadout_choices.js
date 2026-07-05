import { choiceSetLoadouts } from "./builder_loadout_choice_set_loadouts.js";
import { addCounts, dedupeCounts } from "./builder_loadout_counts.js";
import { precomputedLoadoutsForChoiceSets } from "./builder_loadout_precomputed.js";

function validLoadoutsFromChoiceSets(sets) {
  const precomputed = precomputedLoadoutsForChoiceSets(sets);
  if (precomputed) {
    return precomputed;
  }
  const regularSets = sets.filter((item) => !item.alternate);
  const alternateSets = sets.filter((item) => item.alternate);
  const loadouts = [];
  if (regularSets.length) {
    let products = [{}];
    for (const set of regularSets) {
      const setLoadouts = choiceSetLoadouts(set);
      if (!setLoadouts.length) {
        products = [];
        break;
      }
      const next = [];
      for (const base of products) {
        for (const piece of setLoadouts) {
          next.push(addCounts(base, piece));
        }
      }
      products = next;
    }
    loadouts.push(...products);
  } else {
    loadouts.push({});
  }
  for (const set of alternateSets) {
    loadouts.push(...choiceSetLoadouts(set));
  }
  return dedupeCounts(loadouts);
}

export { validLoadoutsFromChoiceSets };
