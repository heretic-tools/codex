import { state } from "./builder_state.js";
import { unitHasWargearItem } from "./builder_validation_core.js";
import {
  detachmentIdsFor,
  mandatoryAllegianceRowsForRoster,
  selectedCountForGroup,
} from "./builder_allegiance_helpers.js";

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

export { allegianceAbilityCandidateStatus };
