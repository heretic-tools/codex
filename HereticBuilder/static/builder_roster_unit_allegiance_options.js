import { allegianceAbilityCandidateStatus } from "./builder_allegiance_rules.js";
import { rosterUnitSummaries } from "./builder_model.js";
import { state } from "./builder_state.js";

function sortAllegianceAbilities(rows) {
  return [...rows].sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0)
    || String(left.name || "").localeCompare(String(right.name || "")));
}

function allegianceAbilityLabel(ability, status = null) {
  const suffix = [];
  if (ability.requiresWargearItemId) {
    const item = state.catalog.wargearItemById.get(ability.requiresWargearItemId);
    const reason = item ? `requires ${item.name}` : "requires wargear";
    if (!status || status.eligible || status.reason !== reason) {
      suffix.push(reason);
    }
  }
  if (status && !status.eligible) {
    suffix.push(status.reason);
  }
  return suffix.length ? `${ability.name} (${suffix.join(" / ")})` : ability.name;
}

function allegianceEditorOptions(roster, unit) {
  const group = state.catalog.allegianceAbilityGroupById.get(unit.allegianceAbilityGroupId);
  if (!group) {
    return null;
  }
  const detachments = (roster.detachmentIds || []).map((id) => ({ id, ...state.catalog.detachmentById.get(id) }));
  const units = rosterUnitSummaries(roster);
  const abilities = sortAllegianceAbilities(state.catalog.allegianceAbilitiesByGroupId.get(group.id) || []);
  const rows = abilities.map((ability, index) => ({
    ability,
    index,
    status: allegianceAbilityCandidateStatus({ ability, detachments, roster, unit, units }),
  })).sort((left, right) => Number(right.status.eligible) - Number(left.status.eligible) || left.index - right.index);
  const label = group.detachmentId
    ? `${group.name} (${state.catalog.detachmentById.get(group.detachmentId)?.name || "required detachment"})`
    : group.name;
  return {
    currentId: unit.allegianceAbilities?.find((ability) => ability.groupId === group.id)?.id || "",
    label,
    options: [
      { label: group.isMandatory ? `Select ${group.name}` : `No ${group.name}`, value: "" },
      ...rows.map((row) => ({
        label: allegianceAbilityLabel(row.ability, row.status),
        value: row.ability.id,
      })),
    ],
  };
}

export { allegianceEditorOptions };
