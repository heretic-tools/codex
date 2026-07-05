import { filterCountsByKeys } from "./builder_wargear_limited_choices.js";

function limitedChoiceCoverIsValid(selectedCounts, choices, choiceLimit, duplicateLimit, mandatory = false) {
  const relevantKeys = new Set(choices.flatMap((choice) => Object.keys(choice || {})));
  const targetCounts = filterCountsByKeys(selectedCounts, relevantKeys);
  const keys = Object.keys(targetCounts).sort();
  if (!keys.length) {
    return !mandatory;
  }
  if (choiceLimit <= 0) {
    return false;
  }
  const target = keys.map((key) => targetCounts[key]);
  const seen = new Set();
  const vectors = choices
    .filter((choice) => Object.keys(choice || {}).every((key) => key in targetCounts))
    .map((choice) => keys.map((key) => choice?.[key] || 0))
    .filter((vector) => vector.some(Boolean))
    .sort((left, right) => right.reduce((sum, value) => sum + value, 0) - left.reduce((sum, value) => sum + value, 0))
    .filter((vector) => {
      const key = vector.join(",");
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  if (!vectors.length) {
    return false;
  }
  const maxRepeats = duplicateLimit == null ? choiceLimit : Math.min(choiceLimit, duplicateLimit);
  const memo = new Map();
  const done = (remaining) => remaining.every((value) => value === 0);
  const subtract = (remaining, vector, repeats) => remaining.map((value, index) => value - vector[index] * repeats);
  const search = (choiceIndex, remaining, used) => {
    if (done(remaining)) {
      return true;
    }
    if (choiceIndex >= vectors.length || used >= choiceLimit) {
      return false;
    }
    const key = `${choiceIndex}:${used}:${remaining.join(",")}`;
    if (memo.has(key)) {
      return memo.get(key);
    }
    if (search(choiceIndex + 1, remaining, used)) {
      memo.set(key, true);
      return true;
    }
    const vector = vectors[choiceIndex];
    for (let repeats = 1; repeats <= Math.min(maxRepeats, choiceLimit - used); repeats += 1) {
      const candidate = subtract(remaining, vector, repeats);
      if (candidate.some((value) => value < 0)) {
        break;
      }
      if (search(choiceIndex + 1, candidate, used + repeats)) {
        memo.set(key, true);
        return true;
      }
    }
    memo.set(key, false);
    return false;
  };
  return search(0, target, 0);
}

export { limitedChoiceCoverIsValid };
