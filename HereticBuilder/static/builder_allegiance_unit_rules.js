import { selectedAllegianceAbilities } from "./builder_model.js";
import { state } from "./builder_state.js";
import { unitHasWargearItem } from "./builder_validation_core.js";
import { unitValidationMessage } from "./builder_validation_messages.js";

function validateUnitAllegianceAbilities(detachmentIds, units, messages) {
  const groupCounts = new Map();
  const groupUnits = new Map();
  for (const unit of units) {
    const groupId = unit.allegianceAbilityGroupId;
    const selectedAbilities = selectedAllegianceAbilities(unit);
    if (!groupId) {
      for (const ability of selectedAbilities) {
        messages.push(unitValidationMessage("allegiance_ability.not_allowed", unit, `${unit.name} cannot select ${ability.name} from ${ability.groupName}.`));
      }
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
    if (group.detachmentId && !detachmentIds.has(group.detachmentId)) {
      for (const ability of selectedAbilities.filter((item) => item.groupId === groupId)) {
        messages.push(unitValidationMessage("allegiance_ability.required_detachment_missing", unit, `${unit.name} cannot select ${ability.name} without its required detachment.`));
      }
      continue;
    }
    for (const ability of selectedAbilities) {
      if (ability.groupId !== groupId) {
        messages.push(unitValidationMessage("allegiance_ability.not_allowed", unit, `${unit.name} cannot select ${ability.name} from ${ability.groupName}.`));
      }
    }
    const selected = selectedAbilities.filter((item) => item.groupId === groupId);
    groupCounts.set(groupId, (groupCounts.get(groupId) || 0) + selected.length);
    if (group.isMandatory && !selected.length) {
      messages.push(unitValidationMessage("allegiance_ability.not_selected", unit, `${unit.name} must select one ${group.name}.`));
    }
    if (selected.length > 1) {
      messages.push(unitValidationMessage("allegiance_ability.multiple_selected", unit, `${unit.name} has too many ${group.name} selections.`));
    }
    for (const ability of selected) {
      if (ability.requiresWargearItemId && !unitHasWargearItem(unit, ability.requiresWargearItemId)) {
        const itemName = state.catalog.wargearItemById.get(ability.requiresWargearItemId)?.name || "required wargear";
        messages.push(unitValidationMessage("allegiance_ability.missing_wargear_item", unit, `${unit.name} with ${ability.name} must be equipped with ${itemName}.`));
      }
    }
  }
  return { groupCounts, groupUnits };
}

export { validateUnitAllegianceAbilities };
