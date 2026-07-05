import { loadoutChoiceItems } from "./builder_loadout_choice_items.js";
import { state } from "./builder_state.js";

function loadoutChoiceSets(datasheetId, miniatureId) {
  return (state.catalog.loadoutChoiceSetsByDatasheetId.get(datasheetId) || [])
    .filter((row) => (miniatureId ? row.miniatureId === miniatureId : !row.miniatureId))
    .sort((left, right) => (
      Number(Boolean(left.alternate)) - Number(Boolean(right.alternate))
      || String(left.id).localeCompare(String(right.id))
    ))
    .map((row) => ({
      ...row,
      choices: (state.catalog.loadoutChoicesBySetId.get(row.id) || []).map((choice) => loadoutChoiceItems(choice.id, {
        datasheetId: row.datasheetId,
        miniatureId: row.miniatureId,
      })),
    }));
}

function choiceSetsContext(sets) {
  if (!sets.length || !sets[0].datasheetId) {
    return null;
  }
  const datasheetId = sets[0].datasheetId || "";
  const miniatureId = sets[0].miniatureId || "";
  if (sets.some((set) => (set.datasheetId || "") !== datasheetId || (set.miniatureId || "") !== miniatureId)) {
    return null;
  }
  return { datasheetId, miniatureId };
}

export { choiceSetsContext, loadoutChoiceSets };
