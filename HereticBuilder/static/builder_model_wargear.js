import { state } from "./builder_state.js";
import { compositionMiniatures } from "./builder_model_compositions.js";
import { defaultMiniatureWargear } from "./builder_model_wargear_defaults.js";

function addWargearCount(result, optionId, count) {
  const value = Math.max(0, Number(count || 0));
  if (!value) {
    return;
  }
  result[optionId] = (result[optionId] || 0) + value;
}

function defaultWargear(datasheetId, compositionId = "") {
  const result = {};
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(datasheetId) || []) {
    if (group.miniatureId) {
      continue;
    }
    for (const item of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      addWargearCount(result, item.id, item.defaultValue);
    }
  }
  return result;
}

function defaultMiniatures(datasheetId, compositionId = "") {
  const composition = state.catalog.compositionById.get(compositionId);
  return compositionMiniatures(composition).map((model) => ({
    miniatureId: model.miniatureId,
    count: Math.max(0, Number(model.min || 0)),
    wargear: defaultMiniatureWargear(datasheetId, model.miniatureId, Math.max(0, Number(model.min || 0))),
  }));
}

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
  defaultMiniatureWargear,
  defaultMiniatures,
  defaultWargear,
  selectedWargearEntries,
  wargearPoints,
};
