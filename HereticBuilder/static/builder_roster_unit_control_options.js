import { option } from "./builder_dom.js";
import {
  unitCandidateGroups,
  unitOptionText,
  unitOptionValue,
} from "./builder_roster_unit_candidates.js";

function refreshUnitControlOptions({ add, clearSearch, roster, search, unitSelect, validation }) {
  const groups = unitCandidateGroups(roster, validation, search.value);
  const nodes = groups.map((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.source.label;
    optgroup.replaceChildren(...group.rows.map((row) => option(
      unitOptionValue(row.allyType, row.datasheet.id),
      unitOptionText(roster, row.allyType, row.datasheet, row.status)
    )));
    return optgroup;
  });
  if (!nodes.length) {
    const empty = option("", search.value.trim() ? "No matching units" : "No units available");
    empty.disabled = true;
    nodes.push(empty);
  }
  unitSelect.replaceChildren(...nodes);
  add.disabled = !groups.length;
  unitSelect.disabled = !groups.length;
  clearSearch.hidden = !search.value;
}

export { refreshUnitControlOptions };
