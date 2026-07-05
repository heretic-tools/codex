function countKey(counts) {
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

function cleanCounts(counts) {
  const result = {};
  for (const [key, value] of Object.entries(counts || {})) {
    const count = Number(value || 0);
    if (count > 0) {
      result[key] = count;
    }
  }
  return result;
}

function countsFromKey(value) {
  const result = {};
  for (const part of String(value || "").split("|")) {
    const index = part.lastIndexOf(":");
    if (index <= 0) {
      continue;
    }
    result[part.slice(0, index)] = Number(part.slice(index + 1) || 0);
  }
  return cleanCounts(result);
}

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

function combinations(items, limit, start = 0) {
  if (limit === 0) {
    return [[]];
  }
  const result = [];
  for (let index = start; index <= items.length - limit; index += 1) {
    for (const tail of combinations(items, limit - 1, index + 1)) {
      result.push([items[index], ...tail]);
    }
  }
  return result;
}

function combinationsWithReplacement(items, limit, start = 0) {
  if (limit === 0) {
    return [[]];
  }
  const result = [];
  for (let index = start; index < items.length; index += 1) {
    for (const tail of combinationsWithReplacement(items, limit - 1, index)) {
      result.push([items[index], ...tail]);
    }
  }
  return result;
}

export {
  addCounts,
  cleanCounts,
  combinations,
  combinationsWithReplacement,
  countKey,
  countsEqual,
  countsFromKey,
  dedupeCounts,
};
