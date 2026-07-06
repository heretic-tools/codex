import { allegianceAbilityCandidateStatus } from "./builder_allegiance_rules.js";
import { rosterUnitSummaries } from "./builder_model.js";
import {
  allegianceAbilityLabel,
  sortAllegianceAbilities,
} from "./builder_roster_unit_allegiance_labels.js";
import { state } from "./builder_state.js";

function allegianceEditorOptions(roster, unit) {
  const group = state.catalog.allegianceAbilityGroupById.get(unit.allegianceAbilityGroupId);
  if (!group) {
    return null;
  }
  const detachments = (roster.detachmentIds || [])
    .map((id) => state.catalog.detachmentById.get(id))
    .filter(Boolean);
  const units = rosterUnitSummaries(roster);
  const abilities = sortAllegianceAbilities(state.catalog.allegianceAbilitiesByGroupId.get(group.id) || []);
  const rows = abilities.map((ability, index) => ({
    ability,
    index,
    status: allegianceAbilityCandidateStatus({ ability, detachments, roster, unit, units }),
  })).sort((left, right) => Number(right.status.eligible) - Number(left.status.eligible) || left.index - right.index);
  const currentId = unit.allegianceAbilities?.find((ability) => ability.groupId === group.id)?.id || "";
  const label = group.detachmentId
    ? `${group.name} (${state.catalog.detachmentById.get(group.detachmentId)?.name || "required detachment"})`
    : group.name;
  return {
    currentId,
    detachments,
    label,
    options: [
      { label: group.isMandatory ? `Select ${group.name}` : `No ${group.name}`, value: "" },
      ...rows.map((row) => ({
        disabled: !row.status.eligible && row.ability.id !== currentId,
        label: allegianceAbilityLabel(row.ability, row.status),
        value: row.ability.id,
      })),
    ],
    units,
  };
}

export { allegianceEditorOptions };
