import { choiceOccurrences } from "./builder_wargear_all_model_choices.js";

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

export {
  activeAllModelBaseChoices,
  allModelSubstituteCount,
};
