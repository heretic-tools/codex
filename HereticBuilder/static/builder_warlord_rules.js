import { state } from "./builder_state.js";
import { namesForIds } from "./builder_model.js";
import { validationMessage } from "./builder_validation_messages.js";
import {
  canBeWarlord,
  detachmentMandatoryWarlordRows,
  mandatoryWarlordForRoster,
} from "./builder_warlord_eligibility.js";
import { warlordCandidateStatus } from "./builder_warlord_candidates.js";
import {
  mandatoryWarlordMissingScope,
  selectedWarlordUnits,
  unitScope,
  unitsWithMiniature,
} from "./builder_warlord_scopes.js";

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
