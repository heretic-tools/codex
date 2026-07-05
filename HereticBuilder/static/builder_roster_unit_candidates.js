import {
  availableDatasheets,
  availableUnitSources,
  compositionFactionIds,
  defaultComposition,
  rosterUnitSummaries,
  unitSummary,
} from "./builder_model.js";
import { rosterWithAddedUnit } from "./builder_roster_actions.js";
import { state } from "./builder_state.js";
import { duplicateLimitForUnit } from "./builder_validation_core.js";

function unitOptionLabel(roster, allyType, datasheet) {
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []);
  const points = composition ? `${composition.points || 0} pts` : "no composition";
  return `${datasheet.name} (${points})`;
}

function candidateSummary(roster, allyType, datasheet) {
  const unitId = `candidate:${allyType}:${datasheet.id}`;
  const candidateRoster = rosterWithAddedUnit(roster, {
    allyType,
    datasheetId: datasheet.id,
    unitId,
  });
  const unit = (candidateRoster.units || []).find((item) => item.id === unitId);
  return unit ? unitSummary(candidateRoster, unit) : null;
}

function unitCandidateStatus(roster, validation, candidate, currentUnits = rosterUnitSummaries(roster)) {
  if (!candidate) {
    return { severity: "error", reason: "no composition" };
  }
  const battleSize = state.catalog.battleSizeById.get(roster.battleSizeId);
  const duplicateLimit = duplicateLimitForUnit(candidate, battleSize?.duplicateUnitLimit || 3);
  const currentCount = currentUnits.filter((unit) => unit.datasheetId === candidate.datasheetId).length;
  if (currentCount >= duplicateLimit) {
    return { severity: "error", reason: `limit ${duplicateLimit} reached` };
  }
  const pointsLimit = validation.points?.limit || 0;
  const nextPoints = (validation.points?.total || 0) + (candidate.points || 0);
  if (pointsLimit && nextPoints > pointsLimit) {
    return { severity: "warning", reason: `${nextPoints - pointsLimit} pts over` };
  }
  return { severity: "ok", reason: "" };
}

function unitOptionText(roster, allyType, datasheet, status) {
  const label = unitOptionLabel(roster, allyType, datasheet);
  return status.reason ? `${label} / ${status.reason}` : label;
}

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
