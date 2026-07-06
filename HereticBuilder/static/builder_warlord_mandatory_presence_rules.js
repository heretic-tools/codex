import { validationMessage } from "./builder_validation_messages.js";
import {
  mandatoryWarlordMissingScope,
  unitScope,
  unitsWithMiniature,
} from "./builder_warlord_scopes.js";

function mandatoryWarlordIsPresent(units, mandatoryWarlordId) {
  return units.some((unit) => (
    (unit.miniatures || []).some((miniature) => miniature.miniatureId === mandatoryWarlordId && miniature.count > 0)
  ));
}

function validateMandatoryWarlordPresence({
  faction,
  mandatoryWarlord,
  mandatoryWarlordId,
  messages,
  units,
  warlordIds,
}) {
  if (!mandatoryWarlordId) {
    return;
  }
  if (!mandatoryWarlordIsPresent(units, mandatoryWarlordId)) {
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

export { mandatoryWarlordIsPresent, validateMandatoryWarlordPresence };
