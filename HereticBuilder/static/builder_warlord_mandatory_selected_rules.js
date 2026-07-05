import { namesForIds } from "./builder_model.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";
import { detachmentMandatoryWarlordRows } from "./builder_warlord_eligibility.js";
import {
  unitScope,
  unitsWithMiniature,
} from "./builder_warlord_scopes.js";
import { supremeCommanderSelections } from "./builder_warlord_supreme_commander_rules.js";

function validateMandatorySelectedWarlordRules({
  detachments,
  faction,
  mandatoryWarlord,
  mandatoryWarlordId,
  messages,
  selectedUnit,
  selectedWarlordId,
  units,
}) {
  const supremeCommanders = supremeCommanderSelections(units);
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
}

export { validateMandatorySelectedWarlordRules };
