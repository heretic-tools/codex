import { state } from "./builder_state.js";
import { rosterSummary } from "./builder_validation_core.js";
import { validationMessage } from "./builder_validation_messages.js";
import { unitIdsScope } from "./builder_allied_rule_helpers.js";

function validateAlliedFactionAvailability(roster, alliedFactionId, label, items, messages) {
  const allowed = (state.catalog.factionAlliedFactionsByFactionId.get(roster.factionKeywordId) || [])
    .some((row) => row.alliedFactionId === alliedFactionId);
  if (!allowed) {
    messages.push(validationMessage(
      "allied_faction.not_available",
      `${label} allies are not available to ${rosterSummary(roster).factionName}.`,
      "error",
      unitIdsScope(items)
    ));
  }
}

export { validateAlliedFactionAvailability };
