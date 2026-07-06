import { option } from "./builder_dom.js";
import {
  unitCandidateGroups,
  unitOptionText,
  unitOptionValue,
} from "./builder_roster_unit_candidates.js";

function refreshUnitControlOptions({ add, clearSearch, roster, search, unitSelect, validation }) {
  const groups = unitCandidateGroups(roster, validation, search.value);
  const firstEnabled = groups
    .flatMap((group) => group.rows)
    .find((row) => row.status.severity !== "error");
  const nodes = groups.map((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.source.label;
    optgroup.replaceChildren(...group.rows.map((row) => option(
      unitOptionValue(row.allyType, row.datasheet.id),
      unitOptionText(roster, row.allyType, row.datasheet, row.status),
      { disabled: row.status.severity === "error" }
    )));
    return optgroup;
  });
  if (!nodes.length) {
    const empty = option("", search.value.trim() ? "No matching units" : "No units available");
    empty.disabled = true;
    nodes.push(empty);
  }
  unitSelect.replaceChildren(...nodes);
  if (firstEnabled) {
    unitSelect.value = unitOptionValue(firstEnabled.allyType, firstEnabled.datasheet.id);
  }
  add.disabled = !firstEnabled;
  unitSelect.disabled = !groups.length;
  clearSearch.hidden = !search.value;
}

export { refreshUnitControlOptions };
