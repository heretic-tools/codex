import { substituteFamilyKey } from "./builder_wargear_all_model_choices.js";
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

export {
  addAllModelFamilyTarget,
  allModelFamilyCheck,
};
