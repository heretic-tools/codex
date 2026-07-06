import { validationMessage } from "./builder_validation_messages.js";
import { mandatoryWarlordForRoster } from "./builder_warlord_eligibility.js";
import { warlordCandidateStatus } from "./builder_warlord_candidates.js";
import { validateMandatoryWarlordPresence } from "./builder_warlord_mandatory_presence_rules.js";
import { validateSelectedWarlordRules } from "./builder_warlord_selected_rules.js";
import {
  selectedWarlordUnits,
  unitScope,
} from "./builder_warlord_scopes.js";

function validateWarlord(roster, detachments, units, messages) {
  if (!units.length) {
    return;
  }
  const { faction, mandatoryWarlordId, mandatoryWarlord } = mandatoryWarlordForRoster(roster);
  const warlordIds = units.flatMap((unit) => unit.warlordMiniatureIds || []);
  validateMandatoryWarlordPresence({ faction, mandatoryWarlord, mandatoryWarlordId, messages, units, warlordIds });
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
