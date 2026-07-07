import { modelCountLabel } from "./builder_count_labels.js";
import {
  currentMiniatureEnhancementId,
  enhancementOptionsFor,
  miniatureEnhancementKeywordIds,
} from "./builder_roster_unit_enhancement_options.js";

function unitEnhancementSelectModel(roster, unit) {
  const currentId = unit.unitEnhancements?.[0]?.id || "";
  const enhancements = enhancementOptionsFor(roster, "unit", currentId);
  if (!enhancements.length && !currentId) {
    return null;
  }
  return {
    currentId,
    enhancements,
    keywordIds: unit.keywordIds || [],
    label: "Whole unit",
    targetKind: "unit",
  };
}

function miniatureEnhancementSelectModels(roster, unit) {
  return (unit.miniatures || []).map((miniature) => {
    const targetId = miniature.rosterUnitMiniatureId || miniature.id;
    const currentId = currentMiniatureEnhancementId(unit, targetId);
    const enhancements = enhancementOptionsFor(roster, "miniature", currentId);
    if (!enhancements.length && !currentId) {
      return null;
    }
    return {
      currentId,
      enhancements,
      keywordIds: miniatureEnhancementKeywordIds(unit, miniature),
      label: `${miniature.name} (${modelCountLabel(miniature.count)})`,
      miniature,
      targetId,
      targetKind: "miniature",
    };
  }).filter(Boolean);
}

function enhancementSelectModels(roster, unit) {
  return [
    unitEnhancementSelectModel(roster, unit),
    ...miniatureEnhancementSelectModels(roster, unit),
  ].filter(Boolean);
}

export { enhancementSelectModels };
