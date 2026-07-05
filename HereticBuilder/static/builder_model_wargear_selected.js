import { state } from "./builder_state.js";

function selectedWargearEntries(unit) {
  const entries = [];
  for (const [optionId, count] of Object.entries(unit.wargear || {})) {
    if ((count || 0) > 0) {
      entries.push({
        optionId,
        count: Number(count || 0),
        rosterUnitMiniatureId: null,
        miniatureId: null,
      });
    }
  }
  for (const miniature of unit.miniatures || []) {
    for (const [optionId, count] of Object.entries(miniature.wargear || {})) {
      if ((count || 0) > 0) {
        entries.push({
          optionId,
          count: Number(count || 0),
          rosterUnitMiniatureId: miniature.rosterUnitMiniatureId || miniature.id,
          miniatureId: miniature.miniatureId,
        });
      }
    }
  }
  return entries;
}

function wargearPoints(unit) {
  return selectedWargearEntries(unit).reduce((total, entry) => {
    const optionRow = state.catalog.wargearOptionById.get(entry.optionId);
    return total + (optionRow?.points || 0) * (entry.count || 0);
  }, 0);
}

export {
  selectedWargearEntries,
  wargearPoints,
};
