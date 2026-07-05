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

function warlordCandidateStatus(roster, detachments, units, unit, miniature) {
  const detachmentIds = detachments.map((item) => item.id);
  const { faction, mandatoryWarlordId, mandatoryWarlord } = mandatoryWarlordForRoster(roster);
  if (mandatoryWarlordId && miniature.miniatureId !== mandatoryWarlordId) {
    return {
      eligible: false,
      reason: `${faction.name || "Faction"} requires ${mandatoryWarlord?.name || "required model"}`,
    };
  }
  const supremeCommanders = units.flatMap((candidate) => (
    (candidate.miniatures || []).filter((item) => item.isSupremeCommander && item.count > 0)
  ));
  if (supremeCommanders.length && !supremeCommanders.some((item) => item.miniatureId === miniature.miniatureId)) {
    return { eligible: false, reason: "Supreme Commander required" };
  }
  const mandatoryRows = detachmentMandatoryWarlordRows(detachments);
  if (mandatoryRows.length && !mandatoryRows.some((row) => row.miniatureId === miniature.miniatureId)) {
    return { eligible: false, reason: `${mandatoryRows[0].detachmentName} requires another Warlord` };
  }
  if (!canBeWarlord(miniature, unit, roster, detachmentIds, [miniature.miniatureId])) {
    return { eligible: false, reason: "not eligible" };
  }
  return { eligible: true, reason: "" };
}

function selectedWarlordUnits(units) {
  return units.filter((unit) => (unit.warlordMiniatureIds || []).length);
}

function targetIdForMiniature(miniature) {
  return miniature?.rosterUnitMiniatureId || miniature?.id || miniature?.miniatureId || "";
}

function warlordTargetIds(unit) {
  const warlordIds = new Set(unit.warlordMiniatureIds || []);
  return (unit.miniatures || [])
    .filter((miniature) => miniature.isWarlord || warlordIds.has(miniature.miniatureId))
    .map(targetIdForMiniature)
    .filter(Boolean);
}

function unitScope(units) {
  const unitIds = [...new Set(units.map((unit) => unit.id).filter(Boolean))];
  const datasheetIds = [...new Set(units.map((unit) => unit.datasheetId).filter(Boolean))];
  const targetIds = [...new Set(units.flatMap(warlordTargetIds))];
  return {
    unitIds,
    datasheetIds,
    targetIds,
  };
}

function unitsWithMiniature(units, miniatureId) {
  return units.filter((unit) => (
    (unit.miniatures || []).some((miniature) => miniature.miniatureId === miniatureId && miniature.count > 0)
  ));
}

function mandatoryWarlordMissingScope(mandatoryWarlordId) {
  const datasheetId = state.catalog.miniatureById.get(mandatoryWarlordId)?.datasheetId || "";
  return datasheetId ? { datasheetId } : null;
}

function validateWarlord(roster, detachments, units, messages) {
  if (!units.length) {
    return;
  }
  const { faction, mandatoryWarlordId, mandatoryWarlord } = mandatoryWarlordForRoster(roster);
  const warlordIds = units.flatMap((unit) => unit.warlordMiniatureIds || []);
  if (mandatoryWarlordId) {
    const mandatoryPresent = units.some((unit) => (
      (unit.miniatures || []).some((miniature) => miniature.miniatureId === mandatoryWarlordId && miniature.count > 0)
    ));
    if (!mandatoryPresent) {
      messages.push(validationMessage(
        "mandatory_warlord.not_present_in_roster",
        `${faction.name || "Faction"} requires ${mandatoryWarlord?.name || "a required model"} in your army.`,
        "error",
        mandatoryWarlordMissingScope(mandatoryWarlordId)
      ));
    } else if (!warlordIds.length) {
      messages.push(validationMessage(
        "mandatory_warlord.not_selected",
        `${faction.name || "Faction"} requires ${mandatoryWarlord?.name || "a required model"} as Warlord.`,
        "error",
        unitScope(unitsWithMiniature(units, mandatoryWarlordId))
      ));
    }
  }
  if (!warlordIds.length) {
    if (!mandatoryWarlordId) {
      messages.push(validationMessage("warlord.not_selected", "Pick one Warlord."));
    }
    return;
  }
  if (warlordIds.length > 1) {
    messages.push(validationMessage(
      "warlord.multiple_selected",
      "Roster has more than one Warlord.",
      "error",
      unitScope(selectedWarlordUnits(units))
    ));
  }
  const detachmentIds = detachments.map((item) => item.id);
  const selectedWarlordId = warlordIds[0];
  const selectedUnit = units.find((unit) => (unit.warlordMiniatureIds || []).includes(selectedWarlordId));
  const supremeCommanders = units.flatMap((unit) => (
    (unit.miniatures || [])
      .filter((miniature) => miniature.isSupremeCommander && miniature.count > 0)
      .map((miniature) => ({ miniature, unit }))
  ));
  if (supremeCommanders.length && !supremeCommanders.some((item) => item.miniature.miniatureId === selectedWarlordId)) {
    messages.push(validationMessage(
      "mandatory_warlord.supreme_commander_not_selected",
      "One of the Supreme Commander units must be your Warlord.",
      "error",
      unitScope([
        ...(selectedUnit ? [selectedUnit] : []),
        ...supremeCommanders.map((item) => item.unit),
      ])
    ));
  }
  const mandatoryRows = detachmentMandatoryWarlordRows(detachments);
  if (mandatoryRows.length && !mandatoryRows.some((row) => row.miniatureId === selectedWarlordId)) {
    const names = namesForIds(state.catalog.miniatureById, mandatoryRows.map((row) => row.miniatureId), "model").join(", ");
    messages.push(validationMessage(
      "mandatory_warlord.detachment_not_selected",
      `${mandatoryRows[0].detachmentName} requires one of these Warlords: ${names}.`,
      "error",
      unitScope(selectedUnit ? [selectedUnit] : [])
    ));
  }
  if (mandatoryWarlordId && selectedWarlordId !== mandatoryWarlordId) {
    messages.push(validationMessage(
      "mandatory_warlord.not_selected",
      `${faction.name || "Faction"} requires ${mandatoryWarlord?.name || "a required model"} as Warlord.`,
      "error",
      unitScope([
        ...(selectedUnit ? [selectedUnit] : []),
        ...unitsWithMiniature(units, mandatoryWarlordId),
      ])
    ));
  }
  const selectedMiniature = selectedUnit?.miniatures?.find((miniature) => miniature.miniatureId === selectedWarlordId);
  if (selectedUnit && selectedMiniature && !canBeWarlord(selectedMiniature, selectedUnit, roster, detachmentIds, warlordIds)) {
    messages.push(validationMessage(
      "warlord.invalid_generic",
      "Selected Warlord is not eligible.",
      "error",
      unitScope([selectedUnit])
    ));
  }
}

export { validateWarlord, warlordCandidateStatus };
