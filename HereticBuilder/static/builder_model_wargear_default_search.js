import { loadoutChoiceSets, validLoadoutsFromChoiceSets } from "./builder_loadout_math.js";
import { rankedDefaultCandidates } from "./builder_model_wargear_default_candidates.js";
import {
  addWargearCount,
  optionItemCounts,
} from "./builder_model_wargear_default_options.js";
import { compareScores, defaultLoadoutScore } from "./builder_model_wargear_default_scores.js";

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
  const candidates = rankedDefaultCandidates(valid, preferred, modelCount);
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
