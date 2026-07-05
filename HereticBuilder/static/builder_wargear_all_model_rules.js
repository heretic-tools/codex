import { state } from "./builder_state.js";
import { unitValidationMessage } from "./builder_validation_messages.js";
import {
  allModelWargearChoices,
} from "./builder_wargear_all_model_choices.js";
import {
  addAllModelFamilyTarget,
  allModelFamilyCheck,
  allModelFamilyTargetIds,
  applyAllModelFamilyCheck,
  hasInvalidAllModelFamilies,
} from "./builder_wargear_all_model_family_checks.js";
import {
  scopeModelCount,
  selectedMiniatureWargearCounts,
  selectedRosterUnitWargearCounts,
} from "./builder_wargear_selection.js";

function validateAllModelWargearChoiceSets(unit, messages) {
  const checksByFamily = new Map();
  for (const row of state.catalog.allModelWargearChoiceSetsByDatasheetId.get(unit.datasheetId) || []) {
    const choices = allModelWargearChoices(row);
    const baseChoices = choices.filter((choice) => !choice.substitute);
    const substituteChoices = choices.filter((choice) => choice.substitute);
    const selected = row.miniatureId
      ? selectedMiniatureWargearCounts(unit, row.miniatureId)
      : selectedRosterUnitWargearCounts(unit);
    const modelCount = scopeModelCount(unit, row.miniatureId);
    if (modelCount <= 0) {
      continue;
    }
    const family = allModelFamilyCheck(checksByFamily, row, substituteChoices);
    addAllModelFamilyTarget(family, unit, row);
    applyAllModelFamilyCheck(family, baseChoices, choices, selected, modelCount);
  }
  if (hasInvalidAllModelFamilies(checksByFamily)) {
    const targetIds = allModelFamilyTargetIds(checksByFamily);
    messages.push(unitValidationMessage("wargear_loadout.invalid_wargear_requirement", unit, `Invalid wargear configuration for ${unit.name}.`, {
      targetIds: [...new Set(targetIds)],
    }));
  }
}

export { validateAllModelWargearChoiceSets };
