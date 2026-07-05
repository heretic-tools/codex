import {
  addCounts,
  combinations,
  combinationsWithReplacement,
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

export { choiceSetLoadouts };
