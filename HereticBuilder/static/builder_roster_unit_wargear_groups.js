import { state } from "./builder_state.js";

function wargearGroupsFor(unit, miniatureId = "") {
  return (state.catalog.wargearGroupsByDatasheetId.get(unit.datasheetId) || [])
    .filter((group) => (group.miniatureId || "") === miniatureId)
    .sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0));
}

export { wargearGroupsFor };
