import { state } from "./builder_state.js";
import { conditionalKeywordApplies } from "./builder_model_selections.js";

function conditionalKeywordRowsForUnit(roster, unit, allegianceAbilities, warlordMiniatureIds) {
  const detachmentIds = new Set(roster.detachmentIds || []);
  const allegianceAbilityIds = new Set(allegianceAbilities.map((item) => item.id));
  return (state.catalog.conditionalKeywordsByDatasheetId.get(unit.datasheetId) || [])
    .filter((row) => conditionalKeywordApplies(row, roster, detachmentIds, allegianceAbilityIds, warlordMiniatureIds));
}

export { conditionalKeywordRowsForUnit };
