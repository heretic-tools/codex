import { state } from "./builder_state.js";
import {
  miniatureKeywordIds,
  selectedAllegianceAbilities,
} from "./builder_model.js";
import { keywordNameInIds } from "./builder_validation_core.js";
import { conditionalKeywordNamedApplies } from "./builder_warlord_conditional_keywords.js";
export {
  detachmentMandatoryWarlordRows,
  mandatoryWarlordForRoster,
} from "./builder_warlord_mandatory_rows.js";

function canBeWarlord(miniature, unit, roster, detachmentIds, warlordIds) {
  if ((state.catalog.detachmentGrantedWarlordsByMiniatureId.get(miniature.miniatureId) || [])
    .some((row) => detachmentIds.includes(row.detachmentId))) {
    return true;
  }
  if (miniature.cannotBeWarlord) {
    return false;
  }
  if (miniature.canBeNonCharacterWarlord) {
    return true;
  }
  const conditionalCharacter = conditionalKeywordNamedApplies(
    unit.datasheetId,
    "Character",
    roster,
    detachmentIds,
    selectedAllegianceAbilities(unit).map((item) => item.id),
    warlordIds
  );
  return keywordNameInIds(miniatureKeywordIds(miniature.miniatureId), "Character") || conditionalCharacter;
}

export { canBeWarlord };
