function loadoutVectorsForSelectedKeys(selected, validLoadouts, keys, target) {
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
  return [...new Map(vectors.map((vector) => [vector.join(","), vector])).values()]
    .sort((left, right) => right.reduce((a, b) => a + b, 0) - left.reduce((a, b) => a + b, 0));
}

function canPartitionLoadouts(selectedCounts, validLoadouts, modelCount) {
  const keys = Object.keys(selectedCounts).sort();
  const target = keys.map((key) => selectedCounts[key]);
  const uniqueVectors = loadoutVectorsForSelectedKeys(selectedCounts, validLoadouts, keys, target);
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

export { canPartitionLoadouts };
