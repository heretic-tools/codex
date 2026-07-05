function limitedChoiceCoverSearch(target, vectors, choiceLimit, duplicateLimit) {
  const maxRepeats = duplicateLimit == null ? choiceLimit : Math.min(choiceLimit, duplicateLimit);
  const memo = new Map();
  const done = (remaining) => remaining.every((value) => value === 0);
  const subtract = (remaining, vector, repeats) => remaining.map((value, index) => value - vector[index] * repeats);
  const search = (choiceIndex, remaining, used) => {
    if (done(remaining)) {
      return true;
    }
    if (choiceIndex >= vectors.length || used >= choiceLimit) {
      return false;
    }
    const key = `${choiceIndex}:${used}:${remaining.join(",")}`;
    if (memo.has(key)) {
      return memo.get(key);
    }
    if (search(choiceIndex + 1, remaining, used)) {
      memo.set(key, true);
      return true;
    }
    const vector = vectors[choiceIndex];
    for (let repeats = 1; repeats <= Math.min(maxRepeats, choiceLimit - used); repeats += 1) {
      const candidate = subtract(remaining, vector, repeats);
      if (candidate.some((value) => value < 0)) {
        break;
      }
      if (search(choiceIndex + 1, candidate, used + repeats)) {
        memo.set(key, true);
        return true;
      }
    }
    memo.set(key, false);
    return false;
  };
  return search(0, target, 0);
}

export { limitedChoiceCoverSearch };
