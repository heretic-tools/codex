import { state } from "./builder_state.js";
import { namesForIds } from "./builder_model.js";
import { validationMessage } from "./builder_validation_messages.js";
import {
  canBeWarlord,
  detachmentMandatoryWarlordRows,
} from "./builder_warlord_eligibility.js";
import {
  unitScope,
  unitsWithMiniature,
} from "./builder_warlord_scopes.js";

function validateSelectedWarlordRules({
  roster,
  detachments,
  units,
  warlordIds,
  mandatoryWarlordId,
  mandatoryWarlord,
  faction,
  messages,
}) {
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

export { validateSelectedWarlordRules };
