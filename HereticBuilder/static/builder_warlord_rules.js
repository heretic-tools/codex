import { validationMessage } from "./builder_validation_messages.js";
import { mandatoryWarlordForRoster } from "./builder_warlord_eligibility.js";
import { warlordCandidateStatus } from "./builder_warlord_candidates.js";
import { validateSelectedWarlordRules } from "./builder_warlord_selected_rules.js";
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
  validateSelectedWarlordRules({
    roster,
    detachments,
    units,
    warlordIds,
    mandatoryWarlordId,
    mandatoryWarlord,
    faction,
    messages,
  });
}

export { validateWarlord, warlordCandidateStatus };
