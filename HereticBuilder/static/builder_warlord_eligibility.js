import { state } from "./builder_state.js";
import {
  conditionalKeywordApplies,
  factionScope,
  lowerName,
  miniatureKeywordIds,
  selectedAllegianceAbilities,
} from "./builder_model.js";
import { keywordNameInIds } from "./builder_validation_core.js";

function conditionalKeywordNamedApplies(datasheetId, keywordName, roster, detachmentIds, allegianceAbilityIds, warlordMiniatureIds) {
  return (state.catalog.conditionalKeywordsByDatasheetId.get(datasheetId) || []).some((row) => (
    lowerName(state.catalog.keywordById.get(row.keywordId)?.name) === lowerName(keywordName)
    && conditionalKeywordApplies(row, roster, new Set(detachmentIds), new Set(allegianceAbilityIds), new Set(warlordMiniatureIds))
  ));
}

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

function mandatoryWarlordForRoster(roster) {
  const faction = factionScope(roster.factionKeywordId)
    .map((id) => state.catalog.factionKeywordById.get(id) || state.catalog.factionById.get(id))
    .find((item) => item?.mandatoryWarlordId)
    || state.catalog.factionKeywordById.get(roster.factionKeywordId)
    || state.catalog.factionById.get(roster.factionKeywordId)
    || {};
  return {
    faction,
    mandatoryWarlordId: faction.mandatoryWarlordId,
    mandatoryWarlord: faction.mandatoryWarlordId ? state.catalog.miniatureById.get(faction.mandatoryWarlordId) : null,
  };
}

function detachmentMandatoryWarlordRows(detachments) {
  return detachments.flatMap((detachment) => (
    (state.catalog.detachmentMandatoryWarlordsByDetachmentId.get(detachment.id) || [])
      .map((row) => ({ ...row, detachmentName: detachment.name }))
  ));
}

export {
  canBeWarlord,
  detachmentMandatoryWarlordRows,
  mandatoryWarlordForRoster,
};
