import {
  miniatureKeywordIds,
  selectedMiniatureEnhancements,
  selectedUnitEnhancements,
} from "./builder_model.js";
import { unitValidationMessage } from "./builder_validation_messages.js";

function targetScope(miniature) {
  const targetId = miniature?.rosterUnitMiniatureId || miniature?.id || miniature?.miniatureId || "";
  return targetId ? { targetId } : {};
}

function selectedEnhancementTargets(units, messages) {
  const selected = [];
  for (const unit of units) {
    const unitSelected = [];
    for (const enhancement of selectedUnitEnhancements(unit)) {
      selected.push({
        unit,
        enhancement,
        keywordIds: new Set(unit.keywordIds || []),
        targetName: unit.name,
        miniature: null,
        targetKind: "unit",
      });
      unitSelected.push(enhancement);
    }
    for (const enhancement of selectedMiniatureEnhancements(unit)) {
      const miniature = (unit.miniatures || []).find((item) => item.rosterUnitMiniatureId === enhancement.targetId || item.id === enhancement.targetId);
      const keywordIds = new Set(miniature
        ? [...miniatureKeywordIds(miniature.miniatureId), ...(unit.conditionalKeywordIds || [])]
        : unit.keywordIds || []);
      const targetName = miniature?.name || unit.name;
      selected.push({ unit, enhancement, keywordIds, targetName, miniature, targetKind: "miniature" });
      unitSelected.push(enhancement);
      if (miniature && miniature.count <= 0) {
        messages.push(unitValidationMessage("enhancement.model_count_zero", unit, `${targetName} cannot take enhancements with a model count of 0.`, targetScope(miniature)));
      }
    }
    if (unitSelected.length > 1) {
      messages.push(unitValidationMessage("enhancement.unit_has_too_many_enhancements", unit, `${unit.name} has selected more than 1 Enhancement.`));
    }
  }
  return selected;
}

export {
  selectedEnhancementTargets,
  targetScope,
};
