import { state } from "./builder_state.js";

function wargearOptionLabel(optionRow) {
  const itemName = wargearOptionName(optionRow);
  const points = optionRow.points ? ` / ${optionRow.points} pts` : "";
  return `${itemName || "Wargear"}${points}`;
}

function wargearOptionName(optionRow = {}) {
  return state.catalog.wargearItemById.get(optionRow.wargearItemId)?.name || "";
}

function wargearOptionRowsForGroup(group) {
  return (state.catalog.wargearOptionsByGroupId.get(group.id) || [])
    .map((optionRow) => ({
      label: wargearOptionLabel(optionRow),
      optionRow,
    }));
}

export {
  wargearOptionLabel,
  wargearOptionName,
  wargearOptionRowsForGroup,
};
