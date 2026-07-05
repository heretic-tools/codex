import { choiceItems, countKey } from "./builder_loadout_math.js";
import { state } from "./builder_state.js";

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

export {
  allModelWargearChoices,
  choiceOccurrences,
  substituteFamilyKey,
};
