import { selectedAllegianceAbilities } from "./builder_model.js";
import { state } from "./builder_state.js";
import {
  pushAllegianceAbilityNotAllowedMessages,
  validateUnitAllegianceAbilitySelections,
} from "./builder_allegiance_unit_selection_rules.js";

function validateUnitAllegianceAbilities(detachmentIds, units, messages) {
  const groupCounts = new Map();
  const groupUnits = new Map();
  for (const unit of units) {
    const groupId = unit.allegianceAbilityGroupId;
    const selectedAbilities = selectedAllegianceAbilities(unit);
    if (!groupId) {
      pushAllegianceAbilityNotAllowedMessages(unit, selectedAbilities, messages);
      continue;
    }
    const group = state.catalog.allegianceAbilityGroupById.get(groupId);
    if (!group) {
      continue;
    }
    if (!groupUnits.has(groupId)) {
      groupUnits.set(groupId, []);
    }
    groupUnits.get(groupId).push(unit);
    const selected = validateUnitAllegianceAbilitySelections(detachmentIds, unit, group, selectedAbilities, messages);
    groupCounts.set(groupId, (groupCounts.get(groupId) || 0) + selected.length);
  }
  return { groupCounts, groupUnits };
}

export { validateUnitAllegianceAbilities };
