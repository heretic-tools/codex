import { idsFromRows } from "./builder_model.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";
import { unitIdsScope } from "./builder_allied_rule_helpers.js";

function validateAlliedFactionDatasheets(alliedFactionId, label, items, messages) {
  const allowedDatasheets = new Set(idsFromRows(
    state.catalog.alliedFactionDatasheetsByAlliedFactionId.get(alliedFactionId),
    "datasheetId"
  ));
  for (const unit of items) {
    if (!allowedDatasheets.has(unit.datasheetId)) {
      messages.push(validationMessage(
        "allied_faction.datasheet_not_allowed",
        `${unit.name} is not allowed for ${label} allies.`,
        "error",
        unitIdsScope([unit])
      ));
    }
  }
}

export { validateAlliedFactionDatasheets };
