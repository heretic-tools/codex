import { state } from "./builder_state.js";

function effectiveWargearLimit(limitedSetId, modelCount) {
  const rows = [...(state.catalog.wargearLimitsByLimitedSetId.get(limitedSetId) || [])]
    .sort((left, right) => (left.modelCount || 0) - (right.modelCount || 0));
  if (!rows.length) {
    return null;
  }
  const eligible = rows.filter((row) => (row.modelCount || 0) <= modelCount);
  return eligible.length ? eligible[eligible.length - 1] : { ...rows[0], choiceLimit: 0, duplicateLimit: 0 };
}

export { effectiveWargearLimit };
