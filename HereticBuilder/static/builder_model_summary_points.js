import { datasheetPointsStepForUnit } from "./builder_model_points.js";
import { wargearPoints } from "./builder_model_wargear.js";

function summaryPoints(roster, unit, composition, unitEnhancements, miniatureEnhancements) {
  const datasheetPointsStep = datasheetPointsStepForUnit(roster, unit);
  const points = (composition?.points || 0)
    + datasheetPointsStep
    + wargearPoints(unit)
    + unitEnhancements.reduce((total, enhancement) => total + (enhancement.points || 0), 0)
    + miniatureEnhancements.reduce((total, enhancement) => total + (enhancement.points || 0), 0);
  return { datasheetPointsStep, points };
}

export { summaryPoints };
