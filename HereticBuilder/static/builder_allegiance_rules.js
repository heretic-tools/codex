import { state } from "./builder_state.js";
import { factionScope, selectedAllegianceAbilities } from "./builder_model.js";
import { rosterSummary, unitHasWargearItem } from "./builder_validation_core.js";
import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";

function validateAllegianceAbilities(roster, detachments, units, messages) {
  const detachmentIds = new Set(detachments.map((detachment) => detachment.id));
  const groupCounts = new Map();
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
  for (const group of state.catalog.allegianceAbilityGroups || []) {
    if (group.minRosterLimit == null && group.maxRosterLimit == null) {
      continue;
    }
    if (group.detachmentId && !detachmentIds.has(group.detachmentId)) {
      continue;
    }
    const count = groupCounts.get(group.id) || 0;
    if (group.minRosterLimit != null && count < group.minRosterLimit) {
      messages.push(validationMessage("allegiance_ability.group_limit_not_reached", `Select at least ${group.minRosterLimit} ${group.name} choices.`));
    }
    if (group.maxRosterLimit != null && count > group.maxRosterLimit) {
      messages.push(validationMessage("allegiance_ability.group_limit_exceeded", `Select at most ${group.maxRosterLimit} ${group.name} choices.`));
    }
  }
  const mandatoryRows = [];
  const seenMandatoryAbilityIds = new Set();
  for (const factionId of factionScope(roster.factionKeywordId)) {
    for (const row of state.catalog.mandatoryAllegianceAbilitiesByFactionId.get(factionId) || []) {
      if (seenMandatoryAbilityIds.has(row.allegianceAbilityId)) {
        continue;
      }
      seenMandatoryAbilityIds.add(row.allegianceAbilityId);
      mandatoryRows.push(row);
    }
  }
  for (const row of mandatoryRows) {
    const ability = state.catalog.allegianceAbilityById.get(row.allegianceAbilityId);
    const groupId = ability?.allegianceAbilityGroupId;
    for (const unit of units) {
      const selectedIds = new Set(selectedAllegianceAbilities(unit).map((item) => item.id));
      if (!selectedIds.size || groupId !== unit.allegianceAbilityGroupId) {
        continue;
      }
      if (!selectedIds.has(row.allegianceAbilityId)) {
        messages.push(unitValidationMessage("allegiance_ability.mandatory_not_selected", unit, `${unit.name} must select ${ability?.name || "required ability"} for ${rosterSummary(roster).factionName}.`));
      }
    }
  }
}

export { validateAllegianceAbilities };
