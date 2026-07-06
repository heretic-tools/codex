import { state } from "./builder_state.js";
import { unitHasWargearItem } from "./builder_validation_core.js";
import { unitValidationMessage } from "./builder_validation_messages.js";

function pushAllegianceAbilityNotAllowedMessages(unit, selectedAbilities, messages) {
  for (const ability of selectedAbilities) {
    messages.push(unitValidationMessage("allegiance_ability.not_allowed", unit, `${unit.name} cannot select ${ability.name} from ${ability.groupName}.`));
  }
}

function validateUnitAllegianceAbilitySelections(detachmentIds, unit, group, selectedAbilities, messages) {
  if (group.detachmentId && !detachmentIds.has(group.detachmentId)) {
    for (const ability of selectedAbilities.filter((item) => item.groupId === group.id)) {
      messages.push(unitValidationMessage("allegiance_ability.required_detachment_missing", unit, `${unit.name} cannot select ${ability.name} without its required detachment.`));
    }
    return [];
  }
  for (const ability of selectedAbilities) {
    if (ability.groupId !== group.id) {
      messages.push(unitValidationMessage("allegiance_ability.not_allowed", unit, `${unit.name} cannot select ${ability.name} from ${ability.groupName}.`));
    }
  }
  const selected = selectedAbilities.filter((item) => item.groupId === group.id);
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
  return selected;
}

export {
  pushAllegianceAbilityNotAllowedMessages,
  validateUnitAllegianceAbilitySelections,
};
