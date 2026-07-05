import { selectedAllegianceAbilities } from "./builder_model.js";
import { state } from "./builder_state.js";
import { rosterSummary } from "./builder_validation_core.js";
import { unitValidationMessage } from "./builder_validation_messages.js";
import { mandatoryAllegianceRowsForRoster } from "./builder_allegiance_helpers.js";

function validateMandatoryAllegianceAbilities(roster, units, messages) {
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

export { validateMandatoryAllegianceAbilities };
