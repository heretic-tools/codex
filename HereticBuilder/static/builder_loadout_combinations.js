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

export { combinations, combinationsWithReplacement };
