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

export { cleanCounts, countKey, countsFromKey };
