import { cleanCounts, countKey } from "./builder_loadout_count_keys.js";

function addCounts(...items) {
  const result = {};
  for (const counts of items) {
    for (const [key, value] of Object.entries(counts || {})) {
      result[key] = (result[key] || 0) + Number(value || 0);
    }
  }
  return cleanCounts(result);
}

function countsEqual(left, right) {
  return countKey(left) === countKey(right);
}

function dedupeCounts(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const clean = cleanCounts(item);
    const key = countKey(clean);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(clean);
  }
  return result;
}

export { addCounts, countsEqual, dedupeCounts };
