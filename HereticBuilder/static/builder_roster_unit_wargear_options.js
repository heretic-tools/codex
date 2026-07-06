import { state } from "./builder_state.js";

function wargearOptionLabel(optionRow) {
  const item = state.catalog.wargearItemById.get(optionRow.wargearItemId);
  const points = optionRow.points ? ` / ${optionRow.points} pts` : "";
  return `${item?.name || "Wargear"}${points}`;
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
  wargearOptionRowsForGroup,
};
