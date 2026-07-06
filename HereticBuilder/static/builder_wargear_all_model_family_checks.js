import { substituteFamilyKey } from "./builder_wargear_all_model_choices.js";
import {
  activeAllModelBaseChoices,
  allModelSubstituteCount,
} from "./builder_wargear_all_model_family_counts.js";
import { targetIdForMiniature } from "./builder_wargear_selection.js";
export {
  allModelFamilyTargetIds,
  hasInvalidAllModelFamilies,
} from "./builder_wargear_all_model_family_results.js";

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

export {
  addAllModelFamilyTarget,
  allModelFamilyCheck,
  applyAllModelFamilyCheck,
};
