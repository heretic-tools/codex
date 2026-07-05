import { idsFromRows } from "./builder_model.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";
import { miniatureNames, unitIdsScope } from "./builder_allied_rule_helpers.js";

function validateAlliedFactionWarlords(alliedFactionId, label, items, warlordIds, messages) {
  const alliedFaction = state.catalog.alliedFactionById.get(alliedFactionId);
  if (alliedFaction?.requiredWarlordMiniatureId && !warlordIds.has(alliedFaction.requiredWarlordMiniatureId)) {
    messages.push(validationMessage(
      "allied_units.required_warlord_missing",
      `Your Warlord must be ${miniatureNames([alliedFaction.requiredWarlordMiniatureId])[0]} to include ${label} allies.`,
      "error",
      unitIdsScope(items)
    ));
  }
  const allowedWarlords = idsFromRows(
    state.catalog.alliedFactionAllowedWarlordsByAlliedFactionId.get(alliedFactionId),
    "miniatureId"
  );
  if (allowedWarlords.length && !allowedWarlords.some((id) => warlordIds.has(id))) {
    messages.push(validationMessage(
      "allied_units.required_warlord_missing",
      `Your Warlord must be one of these models to include ${label} allies: ${miniatureNames(allowedWarlords).join(", ")}.`,
      "error",
      unitIdsScope(items)
    ));
  }
}

export { validateAlliedFactionWarlords };
