import {
  conditionalKeywordApplies,
  lowerName,
} from "./builder_model.js";
import { state } from "./builder_state.js";

function conditionalKeywordNamedApplies(datasheetId, keywordName, roster, detachmentIds, allegianceAbilityIds, warlordMiniatureIds) {
  return (state.catalog.conditionalKeywordsByDatasheetId.get(datasheetId) || []).some((row) => (
    lowerName(state.catalog.keywordById.get(row.keywordId)?.name) === lowerName(keywordName)
    && conditionalKeywordApplies(row, roster, new Set(detachmentIds), new Set(allegianceAbilityIds), new Set(warlordMiniatureIds))
  ));
}

export { conditionalKeywordNamedApplies };
