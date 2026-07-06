import { detachmentMandatoryWarlordRows } from "./builder_warlord_eligibility.js";
import {
  detachmentMandatoryWarlordNotSelectedMessage,
  factionMandatoryWarlordNotSelectedMessage,
  supremeCommanderNotSelectedMessage,
} from "./builder_warlord_mandatory_selected_messages.js";
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
    messages.push(supremeCommanderNotSelectedMessage(selectedUnit, supremeCommanders));
  }

  const mandatoryRows = detachmentMandatoryWarlordRows(detachments);
  if (mandatoryRows.length && !mandatoryRows.some((row) => row.miniatureId === selectedWarlordId)) {
    messages.push(detachmentMandatoryWarlordNotSelectedMessage(selectedUnit, mandatoryRows));
  }

  if (mandatoryWarlordId && selectedWarlordId !== mandatoryWarlordId) {
    messages.push(factionMandatoryWarlordNotSelectedMessage({
      faction,
      mandatoryWarlord,
      mandatoryWarlordId,
      selectedUnit,
      units,
    }));
  }
}

export { validateMandatorySelectedWarlordRules };
