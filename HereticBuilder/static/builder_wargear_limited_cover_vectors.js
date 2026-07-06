import { filterCountsByKeys } from "./builder_wargear_limited_count_filters.js";

function limitedChoiceCoverVectors(selectedCounts, choices) {
  const relevantKeys = new Set(choices.flatMap((choice) => Object.keys(choice || {})));
  const targetCounts = filterCountsByKeys(selectedCounts, relevantKeys);
  const keys = Object.keys(targetCounts).sort();
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
  return { target, vectors };
}

export { limitedChoiceCoverVectors };
