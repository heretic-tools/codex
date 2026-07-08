import { enhancementPoints } from "./builder_model_points.js";
import { unitSummary } from "./builder_model_unit_summary.js";

function rosterUnitSummaries(roster) {
  return (roster.units || []).map((unit, rosterUnitIndex) => ({
    ...unitSummary(roster, unit),
    rosterUnitIndex,
  }));
}

function rosterPoints(roster) {
  return rosterUnitSummaries(roster).reduce((total, unit) => total + (unit.points || 0), 0);
}

export {
  enhancementPoints,
  rosterPoints,
  rosterUnitSummaries,
  unitSummary,
};
