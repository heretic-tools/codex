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

export { compareScores, defaultLoadoutScore };
