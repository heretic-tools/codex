import { namesForIds } from "./builder_model.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";
import { unitScope, unitsWithMiniature } from "./builder_warlord_scopes.js";

function supremeCommanderNotSelectedMessage(selectedUnit, supremeCommanders) {
  return validationMessage(
    "mandatory_warlord.supreme_commander_not_selected",
    "One of the Supreme Commander units must be your Warlord.",
    "error",
    unitScope([
      ...(selectedUnit ? [selectedUnit] : []),
      ...supremeCommanders.map((item) => item.unit),
    ])
  );
}

function detachmentMandatoryWarlordNotSelectedMessage(selectedUnit, mandatoryRows) {
  const names = namesForIds(state.catalog.miniatureById, mandatoryRows.map((row) => row.miniatureId), "model").join(", ");
  return validationMessage(
    "mandatory_warlord.detachment_not_selected",
    `${mandatoryRows[0].detachmentName} requires one of these Warlords: ${names}.`,
    "error",
    unitScope(selectedUnit ? [selectedUnit] : [])
  );
}

function factionMandatoryWarlordNotSelectedMessage({ faction, mandatoryWarlord, mandatoryWarlordId, selectedUnit, units }) {
  return validationMessage(
    "mandatory_warlord.not_selected",
    `${faction.name || "Faction"} requires ${mandatoryWarlord?.name || "a required model"} as Warlord.`,
    "error",
    unitScope([
      ...(selectedUnit ? [selectedUnit] : []),
      ...unitsWithMiniature(units, mandatoryWarlordId),
    ])
  );
}

export {
  detachmentMandatoryWarlordNotSelectedMessage,
  factionMandatoryWarlordNotSelectedMessage,
  supremeCommanderNotSelectedMessage,
};
