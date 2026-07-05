import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";

function unitIdsScope(units) {
  const unitIds = [...new Set((units || []).map((unit) => unit.id).filter(Boolean))];
  return unitIds.length ? { unitIds } : null;
}

function validateAllegianceGroupLimits(detachmentIds, groupCounts, groupUnits, messages) {
  for (const group of state.catalog.allegianceAbilityGroups || []) {
    if (group.minRosterLimit == null && group.maxRosterLimit == null) {
      continue;
    }
    if (group.detachmentId && !detachmentIds.has(group.detachmentId)) {
      continue;
    }
    const count = groupCounts.get(group.id) || 0;
    const scope = unitIdsScope(groupUnits.get(group.id));
    if (group.minRosterLimit != null && count < group.minRosterLimit) {
      messages.push(validationMessage(
        "allegiance_ability.group_limit_not_reached",
        `Select at least ${group.minRosterLimit} ${group.name} choices.`,
        "error",
        scope
      ));
    }
    if (group.maxRosterLimit != null && count > group.maxRosterLimit) {
      messages.push(validationMessage(
        "allegiance_ability.group_limit_exceeded",
        `Select at most ${group.maxRosterLimit} ${group.name} choices.`,
        "error",
        scope
      ));
    }
  }
}

export { validateAllegianceGroupLimits };
