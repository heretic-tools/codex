import {
  availableDatasheets,
  availableUnitSources,
  rosterUnitSummaries,
} from "./builder_model.js";
import {
  candidateSummary,
  unitCandidateStatus,
  unitOptionText,
} from "./builder_roster_unit_candidate_status.js";

function unitOptionValue(allyType, datasheetId) {
  return JSON.stringify({ allyType, datasheetId });
}

function parseUnitOptionValue(value) {
  try {
    const parsed = JSON.parse(value);
    return {
      allyType: parsed.allyType || "native",
      datasheetId: parsed.datasheetId || "",
    };
  } catch {
    return { allyType: "native", datasheetId: value || "" };
  }
}

function unitCandidateGroups(roster, validation, query = "") {
  const normalizedQuery = String(query || "").trim().toLocaleLowerCase();
  const summaries = rosterUnitSummaries(roster);
  return availableUnitSources(roster)
    .map((source) => {
      const rows = availableDatasheets(roster, source.value)
        .filter((datasheet) => (
          !normalizedQuery || String(datasheet.name || "").toLocaleLowerCase().includes(normalizedQuery)
        ))
        .map((datasheet, index) => {
          const candidate = candidateSummary(roster, source.value, datasheet);
          return {
            allyType: source.value,
            candidate,
            datasheet,
            index,
            status: unitCandidateStatus(roster, validation, candidate, summaries),
          };
        })
        .sort((left, right) => (
          Number(right.status.severity === "ok") - Number(left.status.severity === "ok")
          || Number(right.status.severity === "warning") - Number(left.status.severity === "warning")
          || left.index - right.index
        ));
      return { rows, source };
    })
    .filter((group) => group.rows.length);
}

export {
  parseUnitOptionValue,
  unitCandidateGroups,
  unitCandidateStatus,
  unitOptionText,
  unitOptionValue,
};
