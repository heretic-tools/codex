import {
  choiceOccurrences,
  substituteFamilyKey,
} from "./builder_wargear_all_model_choices.js";
import { targetIdForMiniature } from "./builder_wargear_selection.js";

function allModelFamilyCheck(checksByFamily, allModelSet, substituteChoices) {
  const familyKey = substituteFamilyKey(allModelSet, substituteChoices);
  if (!checksByFamily.has(familyKey)) {
    checksByFamily.set(familyKey, {
      hasValidBaseLine: false,
      hasHardInvalid: false,
      hasSubstituteWithoutBase: false,
      targetIds: [],
    });
  }
  return checksByFamily.get(familyKey);
}

function addAllModelFamilyTarget(family, unit, allModelSet) {
  const targetId = targetIdForMiniature(unit, allModelSet.miniatureId);
  if (targetId && !family.targetIds.includes(targetId)) {
    family.targetIds.push(targetId);
  }
}

function activeAllModelBaseChoices(baseChoices, selected) {
  const activeBase = [];
  for (const choice of baseChoices) {
    const occurrences = choiceOccurrences(selected, choice.items);
    if (occurrences) {
      activeBase.push([choice, occurrences]);
    }
  }
  return activeBase;
}

function allModelSubstituteCount(choices, selected) {
  return choices
    .filter((choice) => choice.substitute)
    .reduce((total, choice) => total + choiceOccurrences(selected, choice.items), 0);
}

function applyAllModelFamilyCheck(family, baseChoices, choices, selected, modelCount) {
  const activeBase = activeAllModelBaseChoices(baseChoices, selected);
  const substituteCount = allModelSubstituteCount(choices, selected);
  if (activeBase.length > 1) {
    family.hasHardInvalid = true;
    return;
  }
  if (baseChoices.length && !activeBase.length && substituteCount) {
    family.hasSubstituteWithoutBase = true;
    return;
  }
  if (activeBase.length === 1 && activeBase[0][1] + substituteCount !== modelCount) {
    family.hasHardInvalid = true;
  } else if (activeBase.length === 1) {
    family.hasValidBaseLine = true;
  }
}

function hasInvalidAllModelFamilies(checksByFamily) {
  return [...checksByFamily.values()].some((family) => (
    family.hasHardInvalid || (family.hasSubstituteWithoutBase && !family.hasValidBaseLine)
  ));
}

function allModelFamilyTargetIds(checksByFamily) {
  return [...checksByFamily.values()]
    .flatMap((family) => family.targetIds || [])
    .filter(Boolean);
}

export {
  addAllModelFamilyTarget,
  allModelFamilyCheck,
  allModelFamilyTargetIds,
  applyAllModelFamilyCheck,
  hasInvalidAllModelFamilies,
};
