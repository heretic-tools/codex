import { validationMessage } from "./builder_validation_messages.js";
import { canBeWarlord } from "./builder_warlord_eligibility.js";
import { validateMandatorySelectedWarlordRules } from "./builder_warlord_mandatory_selected_rules.js";
import { unitScope } from "./builder_warlord_scopes.js";

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
  validateMandatorySelectedWarlordRules({
    detachments,
    faction,
    mandatoryWarlord,
    mandatoryWarlordId,
    messages,
    selectedUnit,
    selectedWarlordId,
    units,
  });
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
