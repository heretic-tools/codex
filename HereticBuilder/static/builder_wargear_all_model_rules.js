import { choiceItems, countKey } from "./builder_loadout_math.js";
import { state } from "./builder_state.js";
import { unitValidationMessage } from "./builder_validation_messages.js";
import {
  scopeModelCount,
  selectedMiniatureWargearCounts,
  selectedRosterUnitWargearCounts,
} from "./builder_wargear_selection.js";

function allModelChoiceItems(choiceId, context) {
  return choiceItems(state.catalog.allModelWargearChoiceItemsByChoiceId.get(choiceId), context);
}

function choiceOccurrences(selectedCounts, choice) {
  const entries = Object.entries(choice || {});
  if (!entries.length) {
    return 0;
  }
  return Math.min(...entries.map(([key, count]) => Math.floor((selectedCounts[key] || 0) / count)));
}

function allModelWargearChoices(allModelSet) {
  return (state.catalog.allModelWargearChoicesBySetId.get(allModelSet.id) || []).map((row) => ({
    substitute: Boolean(row.substitute),
    items: allModelChoiceItems(row.id, {
      datasheetId: allModelSet.datasheetId,
      miniatureId: allModelSet.miniatureId,
    }),
  }));
}

function substituteFamilyKey(allModelSet, substituteChoices) {
  const signature = substituteChoices
    .map((choice) => countKey(choice.items))
    .filter(Boolean)
    .sort()
    .join("||");
  return `${allModelSet.datasheetId || ""}:${allModelSet.miniatureId || ""}:${signature}`;
}

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
    const familyKey = substituteFamilyKey(row, substituteChoices);
    if (!checksByFamily.has(familyKey)) {
      checksByFamily.set(familyKey, {
        hasValidBaseLine: false,
        hasHardInvalid: false,
        hasSubstituteWithoutBase: false,
      });
    }
    const family = checksByFamily.get(familyKey);
    const activeBase = [];
    for (const choice of baseChoices) {
      const occurrences = choiceOccurrences(selected, choice.items);
      if (occurrences) {
        activeBase.push([choice, occurrences]);
      }
    }
    const substituteCount = choices
      .filter((choice) => choice.substitute)
      .reduce((total, choice) => total + choiceOccurrences(selected, choice.items), 0);
    if (activeBase.length > 1) {
      family.hasHardInvalid = true;
      continue;
    }
    if (baseChoices.length && !activeBase.length && substituteCount) {
      family.hasSubstituteWithoutBase = true;
      continue;
    }
    if (activeBase.length === 1 && activeBase[0][1] + substituteCount !== modelCount) {
      family.hasHardInvalid = true;
    } else if (activeBase.length === 1) {
      family.hasValidBaseLine = true;
    }
  }
  const invalid = [...checksByFamily.values()].some((family) => (
    family.hasHardInvalid || (family.hasSubstituteWithoutBase && !family.hasValidBaseLine)
  ));
  if (invalid) {
    messages.push(unitValidationMessage("wargear_loadout.invalid_wargear_requirement", unit, `Invalid wargear configuration for ${unit.name}.`));
  }
}

export { validateAllModelWargearChoiceSets };
