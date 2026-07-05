import { addCounts, countKey } from "./builder_loadout_math.js";
import { compareScores, defaultLoadoutScore } from "./builder_model_wargear_default_scores.js";

function rankedDefaultCandidates(valid, preferred, modelCount) {
  if (modelCount <= 1) {
    return valid;
  }
  let candidates = [{}];
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
  return candidates;
}

export { rankedDefaultCandidates };
