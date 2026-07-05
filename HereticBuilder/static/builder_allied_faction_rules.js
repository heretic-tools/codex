import { idsFromRows, unique } from "./builder_model.js";
import { state } from "./builder_state.js";
import { rosterSummary } from "./builder_validation_core.js";
import { validationMessage } from "./builder_validation_messages.js";
import {
  detachmentNames,
  miniatureNames,
  unitIdsScope,
} from "./builder_allied_rule_helpers.js";

function validateAlliedFactionRules(roster, alliedFactionId, label, items, detachmentIds, warlordIds, messages) {
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
  const requiredDetachments = unique([
    alliedFaction?.requiredDetachmentId,
    ...idsFromRows(state.catalog.alliedFactionRequiredDetachmentsByAlliedFactionId.get(alliedFactionId), "detachmentId"),
  ]);
  if (requiredDetachments.length && !requiredDetachments.some((id) => detachmentIds.has(id))) {
    messages.push(validationMessage(
      "allied_unit.required_detachment_not_selected",
      `${label} allies require one of these detachments: ${detachmentNames(requiredDetachments).join(", ")}.`,
      "error",
      unitIdsScope(items)
    ));
  }
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

export { validateAlliedFactionRules };
