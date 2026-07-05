import { selectedAllegianceAbilities } from "./builder_model.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";
import { unitIdsScope } from "./builder_allied_rule_helpers.js";

function validateAlliedRequiredAllegianceAbilities(alliedFactionId, label, units, messages) {
  for (const row of state.catalog.alliedFactionAllegianceAbilitiesByAlliedFactionId.get(alliedFactionId) || []) {
    const selectedIds = new Set(units.flatMap((unit) => selectedAllegianceAbilities(unit).map((ability) => ability.id)));
    if (!selectedIds.has(row.allegianceAbilityId)) {
      const ability = state.catalog.allegianceAbilityById.get(row.allegianceAbilityId);
      const group = ability ? state.catalog.allegianceAbilityGroupById.get(ability.allegianceAbilityGroupId) : null;
      messages.push(validationMessage(
        "allied_unit.required_allegiance_ability_missing",
        `${label} allies must select ${ability?.name || "required ability"} from ${group?.name || "its group"}.`,
        "error",
        unitIdsScope(units)
      ));
    }
  }
}

export { validateAlliedRequiredAllegianceAbilities };
