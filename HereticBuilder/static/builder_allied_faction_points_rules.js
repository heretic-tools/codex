import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";
import { unitIdsScope } from "./builder_allied_rule_helpers.js";

function validateAlliedFactionPoints(roster, alliedFactionId, label, items, messages) {
  const pointsLimit = (state.catalog.alliedFactionPointsLimitsByAlliedFactionId.get(alliedFactionId) || [])
    .find((row) => row.battleSizeId === roster.battleSizeId);
  if (!pointsLimit) {
    return;
  }
  const total = items.reduce((sum, unit) => sum + (unit.points || 0), 0);
  if (total > pointsLimit.pointsLimit) {
    messages.push(validationMessage(
      "allied_points.limit_exceeded",
      `${label} allies use ${total} points; limit is ${pointsLimit.pointsLimit}.`,
      "error",
      unitIdsScope(items)
    ));
  }
}

export { validateAlliedFactionPoints };
