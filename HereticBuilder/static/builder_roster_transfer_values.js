function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringArray(values) {
  return Array.isArray(values) ? values.filter((value) => typeof value === "string" && value) : [];
}

export { numberOrNull, stringArray };
