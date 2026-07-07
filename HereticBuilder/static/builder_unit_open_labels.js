function unitModelCountLabelForOpenLabel(count) {
  return `${count} ${count === 1 ? "model" : "models"}`;
}

function unitOpenLabel(unit, { sourceLabel = "" } = {}) {
  const parts = [unit.name || "Unit"];
  if (unit.modelCount != null) {
    parts.push(unitModelCountLabelForOpenLabel(unit.modelCount || 0));
  }
  if (unit.points != null) {
    parts.push(`${unit.points || 0} pts`);
  }
  if (unit.isWarlord) {
    parts.push("Warlord");
  }
  if (sourceLabel) {
    parts.push(sourceLabel);
  }
  return `Open unit: ${parts.join(", ")}`;
}

export { unitOpenLabel };
