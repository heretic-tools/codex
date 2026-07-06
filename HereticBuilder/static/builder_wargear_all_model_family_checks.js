import {
  activeAllModelBaseChoices,
  allModelSubstituteCount,
} from "./builder_wargear_all_model_family_counts.js";
export {
  addAllModelFamilyTarget,
  allModelFamilyCheck,
} from "./builder_wargear_all_model_family_state.js";
export {
  allModelFamilyTargetIds,
  hasInvalidAllModelFamilies,
} from "./builder_wargear_all_model_family_results.js";

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
  applyAllModelFamilyCheck,
};
