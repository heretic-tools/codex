import { loadoutChoiceSets } from "./builder_loadout_catalog.js";
import { cleanCounts, countsEqual } from "./builder_loadout_counts.js";
import { validLoadoutsFromChoiceSets } from "./builder_loadout_choices.js";

function canPartitionLoadouts(selectedCounts, validLoadouts, modelCount) {
  const selected = cleanCounts(selectedCounts);
  const keys = Object.keys(selected).sort();
  const target = keys.map((key) => selected[key]);
  const vectors = [];
  for (const loadout of validLoadouts) {
    if (Object.keys(loadout).some((key) => !(key in selected))) {
      continue;
    }
    const vector = keys.map((key) => loadout[key] || 0);
    if (vector.every((value, index) => value <= target[index])) {
      vectors.push(vector);
    }
  }
  const uniqueVectors = [...new Map(vectors.map((vector) => [vector.join(","), vector])).values()]
    .sort((left, right) => right.reduce((a, b) => a + b, 0) - left.reduce((a, b) => a + b, 0));
  if (!uniqueVectors.length) {
    return !keys.length && modelCount === 0;
  }
  const memo = new Map();
  const fits = (vector, remaining) => vector.every((value, index) => value <= remaining[index]);
  const subtract = (vector, remaining) => remaining.map((value, index) => value - vector[index]);
  const search = (remaining, modelsLeft) => {
    const key = `${remaining.join(",")}:${modelsLeft}`;
    if (memo.has(key)) {
      return memo.get(key);
    }
    if (modelsLeft === 0) {
      const done = remaining.every((value) => value === 0);
      memo.set(key, done);
      return done;
    }
    for (const vector of uniqueVectors) {
      if (fits(vector, remaining) && search(subtract(vector, remaining), modelsLeft - 1)) {
        memo.set(key, true);
        return true;
      }
    }
    memo.set(key, false);
    return false;
  };
  return search(target, modelCount);
}

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
