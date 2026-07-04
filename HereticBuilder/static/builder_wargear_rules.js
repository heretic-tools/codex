import { wargearLoadoutMatchesChoiceSets } from "./builder_loadout_math.js";
import { selectedWargearEntries } from "./builder_model.js";
import { unitValidationMessage } from "./builder_validation_messages.js";
import { validateAllModelWargearChoiceSets } from "./builder_wargear_all_model_rules.js";
import { validateLimitedWargearChoiceSets } from "./builder_wargear_limited_rules.js";
import { validateWargearEntryScope } from "./builder_wargear_scope_rules.js";
import { selectedMiniatureWargearCounts, selectedUnitWargearCounts } from "./builder_wargear_selection.js";

function validateWargearLoadouts(units, messages) {
  for (const unit of units) {
    for (const entry of selectedWargearEntries(unit)) {
      validateWargearEntryScope(unit, entry, messages);
    }
    if (!wargearLoadoutMatchesChoiceSets(unit.datasheetId, null, selectedUnitWargearCounts(unit), 1)) {
      messages.push(unitValidationMessage("wargear_loadout.invalid_unit_wargear_loadout", unit, `${unit.name} has an invalid unit wargear configuration.`));
    }
    for (const miniature of unit.miniatures || []) {
      const selected = selectedMiniatureWargearCounts(unit, miniature);
      if (miniature.count === 0) {
        if (Object.keys(selected).length) {
          messages.push(unitValidationMessage("wargear_loadout.zero_count_model_wargear", unit, `${unit.name} has wargear selected for a model count of 0: ${miniature.name}.`, {
            targetId: miniature.rosterUnitMiniatureId || miniature.id || miniature.miniatureId,
          }));
        }
        continue;
      }
      if (!wargearLoadoutMatchesChoiceSets(unit.datasheetId, miniature.miniatureId, selected, miniature.count)) {
        messages.push(unitValidationMessage(
          "wargear_loadout.invalid_miniature_wargear_loadout",
          unit,
          unit.modelCount === 1
            ? `Invalid wargear selected for ${unit.name}.`
            : `Invalid wargear selected for ${miniature.name} model in ${unit.name}.`,
          {
            targetId: miniature.rosterUnitMiniatureId || miniature.id || miniature.miniatureId,
          }
        ));
      }
    }
    validateLimitedWargearChoiceSets(unit, messages);
    validateAllModelWargearChoiceSets(unit, messages);
  }
}

export { validateWargearLoadouts };
