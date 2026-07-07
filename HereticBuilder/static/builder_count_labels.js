function modelCountLabel(count) {
  const value = Math.max(0, Number(count || 0));
  return `${value} ${value === 1 ? "model" : "models"}`;
}

export { modelCountLabel };
