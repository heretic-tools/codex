import { state } from "./builder_state.js";
import {
  miniatureKeywordIds,
} from "./builder_model_core.js";
import { conditionalKeywordRowsForUnit } from "./builder_model_conditional_keyword_rows.js";
export { rosterWarlordMiniatureIds } from "./builder_model_warlord_ids.js";

function unitKeywords(roster, unit, miniatures, allegianceAbilities, warlordMiniatureIds, conditionalKeywordRows = null) {
  const keywordIds = new Set();
  for (const miniature of miniatures) {
    if ((miniature.count || 0) <= 0) {
      continue;
    }
    for (const keywordId of miniatureKeywordIds(miniature.miniatureId)) {
      keywordIds.add(keywordId);
    }
  }
  if (!keywordIds.size && !miniatures.length) {
    for (const miniature of state.catalog.miniaturesByDatasheetId.get(unit.datasheetId) || []) {
      for (const keywordId of miniatureKeywordIds(miniature.id)) {
        keywordIds.add(keywordId);
      }
    }
  }
  for (const row of conditionalKeywordRows ?? conditionalKeywordRowsForUnit(roster, unit, allegianceAbilities, warlordMiniatureIds)) {
    keywordIds.add(row.keywordId);
  }
  return [...keywordIds]
    .map((id) => state.catalog.keywordById.get(id))
    .filter(Boolean)
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export {
  conditionalKeywordRowsForUnit,
  unitKeywords,
};
