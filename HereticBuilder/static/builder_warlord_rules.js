import { state } from "./builder_state.js";
import { conditionalKeywordApplies, factionScope, lowerName, miniatureKeywordIds, namesForIds, selectedAllegianceAbilities } from "./builder_model.js";
import { keywordNameInIds } from "./builder_validation_core.js";
import { validationMessage } from "./builder_validation_messages.js";

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

function validateWarlord(roster, detachments, units, messages) {
  if (!units.length) {
    return;
  }
  const faction = factionScope(roster.factionKeywordId)
    .map((id) => state.catalog.factionKeywordById.get(id) || state.catalog.factionById.get(id))
    .find((item) => item?.mandatoryWarlordId)
    || state.catalog.factionKeywordById.get(roster.factionKeywordId)
    || state.catalog.factionById.get(roster.factionKeywordId)
    || {};
  const mandatoryWarlordId = faction.mandatoryWarlordId;
  const mandatoryWarlord = mandatoryWarlordId ? state.catalog.miniatureById.get(mandatoryWarlordId) : null;
  const warlordIds = units.flatMap((unit) => unit.warlordMiniatureIds || []);
  if (mandatoryWarlordId) {
    const mandatoryPresent = units.some((unit) => (
      (unit.miniatures || []).some((miniature) => miniature.miniatureId === mandatoryWarlordId && miniature.count > 0)
    ));
    if (!mandatoryPresent) {
      messages.push(validationMessage("mandatory_warlord.not_present_in_roster", `${faction.name || "Faction"} requires ${mandatoryWarlord?.name || "a required model"} in your army.`));
    } else if (!warlordIds.length) {
      messages.push(validationMessage("mandatory_warlord.not_selected", `${faction.name || "Faction"} requires ${mandatoryWarlord?.name || "a required model"} as Warlord.`));
    }
  }
  if (!warlordIds.length) {
    if (!mandatoryWarlordId) {
      messages.push(validationMessage("warlord.not_selected", "Pick one Warlord."));
    }
    return;
  }
  if (warlordIds.length > 1) {
    messages.push(validationMessage("warlord.multiple_selected", "Roster has more than one Warlord."));
  }
  const detachmentIds = detachments.map((item) => item.id);
  const selectedWarlordId = warlordIds[0];
  const supremeCommanders = units.flatMap((unit) => (
    (unit.miniatures || []).filter((miniature) => miniature.isSupremeCommander && miniature.count > 0)
  ));
  if (supremeCommanders.length && !supremeCommanders.some((item) => item.miniatureId === selectedWarlordId)) {
    messages.push(validationMessage("mandatory_warlord.supreme_commander_not_selected", "One of the Supreme Commander units must be your Warlord."));
  }
  const mandatoryRows = detachments.flatMap((detachment) => (
    (state.catalog.detachmentMandatoryWarlordsByDetachmentId.get(detachment.id) || [])
      .map((row) => ({ ...row, detachmentName: detachment.name }))
  ));
  if (mandatoryRows.length && !mandatoryRows.some((row) => row.miniatureId === selectedWarlordId)) {
    const names = namesForIds(state.catalog.miniatureById, mandatoryRows.map((row) => row.miniatureId), "model").join(", ");
    messages.push(validationMessage("mandatory_warlord.detachment_not_selected", `${mandatoryRows[0].detachmentName} requires one of these Warlords: ${names}.`));
  }
  if (mandatoryWarlordId && selectedWarlordId !== mandatoryWarlordId) {
    messages.push(validationMessage("mandatory_warlord.not_selected", `${faction.name || "Faction"} requires ${mandatoryWarlord?.name || "a required model"} as Warlord.`));
  }
  const selectedUnit = units.find((unit) => (unit.warlordMiniatureIds || []).includes(selectedWarlordId));
  const selectedMiniature = selectedUnit?.miniatures?.find((miniature) => miniature.miniatureId === selectedWarlordId);
  if (selectedUnit && selectedMiniature && !canBeWarlord(selectedMiniature, selectedUnit, roster, detachmentIds, warlordIds)) {
    messages.push(validationMessage("warlord.invalid_generic", "Selected Warlord is not eligible."));
  }
}

export { validateWarlord };
