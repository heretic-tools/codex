import { state } from "./builder_state.js";
import { factionScope, selectedAllegianceAbilities } from "./builder_model.js";
import { rosterSummary, unitHasWargearItem } from "./builder_validation_core.js";
import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";

function detachmentIdsFor(roster, detachments) {
  const ids = new Set((roster?.detachmentIds || []).filter(Boolean));
  for (const detachment of detachments || []) {
    if (detachment?.id) {
      ids.add(detachment.id);
    }
  }
  return ids;
}

function mandatoryAllegianceRowsForRoster(roster) {
  const rows = [];
  const seenAbilityIds = new Set();
  for (const factionId of factionScope(roster.factionKeywordId)) {
    for (const row of state.catalog.mandatoryAllegianceAbilitiesByFactionId.get(factionId) || []) {
      if (seenAbilityIds.has(row.allegianceAbilityId)) {
        continue;
      }
      seenAbilityIds.add(row.allegianceAbilityId);
      rows.push(row);
    }
  }
  return rows;
}

function selectedCountForGroup(units, groupId, currentUnitId) {
  let count = 0;
  let currentUnitSelected = false;
  for (const unit of units || []) {
    const selected = selectedAllegianceAbilities(unit).filter((ability) => ability.groupId === groupId);
    if (unit.id === currentUnitId && selected.length) {
      currentUnitSelected = true;
    }
    count += selected.length;
  }
  return { count, currentUnitSelected };
}

function unitIdsScope(units) {
  const unitIds = [...new Set((units || []).map((unit) => unit.id).filter(Boolean))];
  return unitIds.length ? { unitIds } : null;
}

function allegianceAbilityCandidateStatus({ ability, detachments = [], roster, unit, units = [] }) {
  const groupId = unit?.allegianceAbilityGroupId;
  const group = state.catalog.allegianceAbilityGroupById.get(groupId);
  if (!ability || !group) {
    return { eligible: false, reason: "not available" };
  }
  if (ability.allegianceAbilityGroupId !== group.id && ability.groupId !== group.id) {
    return { eligible: false, reason: `requires ${group.name}` };
  }

  const detachmentIds = detachmentIdsFor(roster, detachments);
  if (group.detachmentId && !detachmentIds.has(group.detachmentId)) {
    const detachmentName = state.catalog.detachmentById.get(group.detachmentId)?.name || "required detachment";
    return { eligible: false, reason: `requires ${detachmentName}` };
  }

  const mandatoryAbilityIds = new Set(
    mandatoryAllegianceRowsForRoster(roster)
      .filter((row) => state.catalog.allegianceAbilityById.get(row.allegianceAbilityId)?.allegianceAbilityGroupId === group.id)
      .map((row) => row.allegianceAbilityId)
  );
  if (mandatoryAbilityIds.size && !mandatoryAbilityIds.has(ability.id)) {
    const names = [...mandatoryAbilityIds]
      .map((id) => state.catalog.allegianceAbilityById.get(id)?.name)
      .filter(Boolean);
    return { eligible: false, reason: `requires ${names.join(" or ") || "required ability"}` };
  }

  if (ability.requiresWargearItemId && !unitHasWargearItem(unit, ability.requiresWargearItemId)) {
    const itemName = state.catalog.wargearItemById.get(ability.requiresWargearItemId)?.name || "wargear";
    return { eligible: false, reason: `requires ${itemName}` };
  }

  const { count, currentUnitSelected } = selectedCountForGroup(units, group.id, unit.id);
  if (group.maxRosterLimit != null && count >= group.maxRosterLimit && !currentUnitSelected) {
    return { eligible: false, reason: "group limit reached" };
  }

  return { eligible: true };
}

function validateAllegianceAbilities(roster, detachments, units, messages) {
  const detachmentIds = new Set(detachments.map((detachment) => detachment.id));
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
  for (const row of mandatoryAllegianceRowsForRoster(roster)) {
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

export { allegianceAbilityCandidateStatus, validateAllegianceAbilities };
