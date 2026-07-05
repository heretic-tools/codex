import {
  canonicalWargearKey,
  choiceItems,
  loadoutChoiceSets,
  wargearOptionKey,
} from "./builder_loadout_catalog.js";
import { precomputedLoadoutsForChoiceSets } from "./builder_loadout_precomputed.js";
import {
  addCounts,
  cleanCounts,
  combinations,
  combinationsWithReplacement,
  countKey,
  countsEqual,
  dedupeCounts,
} from "./builder_loadout_counts.js";

function choiceSetLoadouts(choiceSet) {
  const choices = choiceSet.choices || [];
  const limit = choiceSet.limit || 0;
  if (limit === 0) {
    return [{}];
  }
  if (!choices.length) {
    return [];
  }
  if (choiceSet.allowDuplicates) {
    return dedupeCounts(combinationsWithReplacement(choices, limit).map((items) => addCounts(...items)));
  }
  const emptyChoices = choices.filter((choice) => !Object.keys(choice).length);
  if (emptyChoices.length) {
    const nonEmptyChoices = choices.filter((choice) => Object.keys(choice).length);
    const raw = [];
    for (let selectedCount = 0; selectedCount <= Math.min(limit, nonEmptyChoices.length); selectedCount += 1) {
      raw.push(...combinations(nonEmptyChoices, selectedCount));
    }
    return dedupeCounts(raw.map((items) => addCounts(...items)));
  }
  if (limit > choices.length) {
    return [];
  }
  return dedupeCounts(combinations(choices, limit).map((items) => addCounts(...items)));
}

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

export {
  addCounts,
  canonicalWargearKey,
  choiceItems,
  cleanCounts,
  countKey,
  loadoutChoiceSets,
  validLoadoutsFromChoiceSets,
  wargearOptionKey,
  wargearLoadoutMatchesChoiceSets,
};
