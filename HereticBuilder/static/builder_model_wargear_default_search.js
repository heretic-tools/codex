import {
  addCounts,
  countKey,
  loadoutChoiceSets,
  validLoadoutsFromChoiceSets,
} from "./builder_loadout_math.js";
import {
  addWargearCount,
  optionItemCounts,
} from "./builder_model_wargear_default_options.js";

function defaultLoadoutScore(candidate, preferred) {
  const keys = new Set([...Object.keys(candidate || {}), ...Object.keys(preferred || {})]);
  let overlap = 0;
  let over = 0;
  let under = 0;
  let total = 0;
  for (const key of keys) {
    const candidateValue = candidate[key] || 0;
    const preferredValue = preferred[key] || 0;
    overlap += Math.min(candidateValue, preferredValue);
    over += Math.max(0, candidateValue - preferredValue);
    under += Math.max(0, preferredValue - candidateValue);
    total += candidateValue;
  }
  return [overlap, -over, -under, -total];
}

function compareScores(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

function closestValidDefaultLoadout(datasheetId, miniatureId, preferredOptions, modelCount, optionByKey) {
  const preferred = optionItemCounts(preferredOptions);
  const sets = loadoutChoiceSets(datasheetId, miniatureId);
  if (!sets.length) {
    return Object.keys(preferred).length ? null : {};
  }
  const valid = validLoadoutsFromChoiceSets(sets)
    .filter((loadout) => Object.keys(loadout).every((key) => optionByKey.has(key)));
  if (!valid.length) {
    return null;
  }
  let candidates = valid;
  if (modelCount > 1) {
    candidates = [{}];
    for (let index = 0; index < modelCount; index += 1) {
      const seen = new Set();
      const next = [];
      for (const base of candidates) {
        for (const loadout of valid) {
          const candidate = addCounts(base, loadout);
          const key = countKey(candidate);
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          next.push(candidate);
        }
      }
      candidates = next
        .sort((left, right) => compareScores(defaultLoadoutScore(right, preferred), defaultLoadoutScore(left, preferred)))
        .slice(0, 2000);
    }
  }
  let best = candidates[0];
  let bestScore = defaultLoadoutScore(best, preferred);
  for (const candidate of candidates.slice(1)) {
    const score = defaultLoadoutScore(candidate, preferred);
    if (compareScores(score, bestScore) > 0) {
      best = candidate;
      bestScore = score;
    }
  }
  const result = {};
  for (const [key, count] of Object.entries(best || {})) {
    const optionId = optionByKey.get(key);
    if (!optionId) {
      return null;
    }
    addWargearCount(result, optionId, count);
  }
  return result;
}

export { closestValidDefaultLoadout };
