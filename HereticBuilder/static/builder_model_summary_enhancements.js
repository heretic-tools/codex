import {
  miniatureKeywordIds,
  unique,
} from "./builder_model_core.js";
import {
  selectedMiniatureEnhancements,
  selectedUnitEnhancements,
} from "./builder_model_selections.js";
import { enhancementPoints } from "./builder_model_points.js";

function summaryEnhancements(unit, miniatures, keywordIds, conditionalKeywordIds) {
  const unitEnhancements = selectedUnitEnhancements(unit).map((enhancement) => ({
    ...enhancement,
    points: enhancementPoints(enhancement.id, keywordIds),
  }));
  const miniatureEnhancements = selectedMiniatureEnhancements(unit).map((enhancement) => {
    const miniature = miniatures.find((item) => (
      item.rosterUnitMiniatureId === enhancement.targetId || item.id === enhancement.targetId
    ));
    const targetKeywordIds = miniature ? unique([...miniatureKeywordIds(miniature.miniatureId), ...conditionalKeywordIds]) : keywordIds;
    return {
      ...enhancement,
      points: enhancementPoints(enhancement.id, targetKeywordIds),
    };
  });
  return { miniatureEnhancements, unitEnhancements };
}

export { summaryEnhancements };
