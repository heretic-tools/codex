import { state } from "./builder_state.js";
import { compositionMiniatures } from "./builder_model_compositions.js";
import { defaultMiniatureWargear } from "./builder_model_wargear_defaults.js";
export {
  selectedWargearEntries,
  wargearPoints,
} from "./builder_model_wargear_selected.js";

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

export {
  defaultMiniatureWargear,
  defaultMiniatures,
  defaultWargear,
};
