import { numberOrNull } from "./builder_roster_transfer_values.js";

function normalizedWargearMap(wargear) {
  const result = {};
  if (!wargear || typeof wargear !== "object" || Array.isArray(wargear)) {
    return result;
  }
  for (const [optionId, count] of Object.entries(wargear)) {
    const value = numberOrNull(count);
    if (typeof optionId === "string" && optionId && value > 0) {
      result[optionId] = value;
    }
  }
  return result;
}

export { normalizedWargearMap };
