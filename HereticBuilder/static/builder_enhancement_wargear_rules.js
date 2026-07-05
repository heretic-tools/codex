import { state } from "./builder_state.js";
import { unitHasWargearItem } from "./builder_validation_core.js";

function missingEnhancementRequiredWargearName(enhancementId, unit, miniature = null) {
  for (const row of state.catalog.enhancementRequiredWargearItemsByEnhancementId.get(enhancementId) || []) {
    if (!unitHasWargearItem(unit, row.wargearItemId, miniature)) {
      return state.catalog.wargearItemById.get(row.wargearItemId)?.name || "required wargear";
    }
  }
  return "";
}

export { missingEnhancementRequiredWargearName };
