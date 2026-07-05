import { state } from "./builder_state.js";
import {
  miniatureKeywordIds,
  selectedMiniatureEnhancements,
  selectedUnitEnhancements,
} from "./builder_model.js";
import { keywordNameInIds, unitHasWargearItem } from "./builder_validation_core.js";
import { unitValidationMessage } from "./builder_validation_messages.js";
import { enhancementBodyguardRequirementSatisfied, validateAttachedUnitEnhancementLimits } from "./builder_attachment_rules.js";
import {
  detachmentNames,
  enhancementBlocksWarlordTarget,
  enhancementCandidateStatus,
  enhancementExcludedKeywordNames,
  enhancementRequiredKeywordsSatisfied,
} from "./builder_enhancement_eligibility.js";
import {
  validateCombatPatrolEnhancements,
  validateEnhancementSelectionLimits,
} from "./builder_enhancement_limit_rules.js";

function targetScope(miniature) {
  const targetId = miniature?.rosterUnitMiniatureId || miniature?.id || miniature?.miniatureId || "";
  return targetId ? { targetId } : {};
}

function validateEnhancements(roster, detachments, units, messages) {
  const detachmentIds = new Set(detachments.map((detachment) => detachment.id));
  const selected = [];
  for (const unit of units) {
    const unitSelected = [];
    for (const enhancement of selectedUnitEnhancements(unit)) {
      selected.push({ unit, enhancement, keywordIds: new Set(unit.keywordIds || []), targetName: unit.name, miniature: null, targetKind: "unit" });
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
        messages.push(unitValidationMessage("enhancement.model_count_zero", unit, `${targetName} cannot take enhancements with a model count of 0.`, {
          targetId: miniature.rosterUnitMiniatureId || miniature.id || miniature.miniatureId,
        }));
      }
    }
    if (unitSelected.length > 1) {
      messages.push(unitValidationMessage("enhancement.unit_has_too_many_enhancements", unit, `${unit.name} has selected more than 1 Enhancement.`));
    }
  }
  validateEnhancementSelectionLimits(roster, selected, messages);
  for (const item of selected) {
    const { unit, enhancement, keywordIds, targetName, miniature, targetKind } = item;
    if (enhancement.detachmentId && !detachmentIds.has(enhancement.detachmentId)) {
      messages.push(unitValidationMessage("enhancement.required_detachment_missing", unit, `${enhancement.name} requires the ${detachmentNames([enhancement.detachmentId])[0]} detachment.`, targetScope(miniature)));
    }
    if (targetKind === "miniature" && enhancement.enhancementType !== "miniature") {
      messages.push(unitValidationMessage("enhancement.target_type_invalid", unit, `${enhancement.name} must be selected for a unit, not a model.`, targetScope(miniature)));
    }
    if (targetKind === "unit" && enhancement.enhancementType === "miniature") {
      messages.push(unitValidationMessage("enhancement.target_type_invalid", unit, `${enhancement.name} must be selected for a model, not a unit.`));
    }
    if ((unit.allyType || "native") !== "native" && state.catalog.alliedFactionById.get(unit.allyType)?.canTakeEnhancements === false) {
      messages.push(unitValidationMessage("enhancement.allied_unit_not_allowed", unit, `${unit.name} cannot take enhancements as an allied unit.`));
    }
    if (miniature?.excludedFromEnhancements) {
      messages.push(unitValidationMessage("enhancement.model_excluded", unit, `${targetName} cannot take enhancements.`, targetScope(miniature)));
    }
    if (!enhancement.isEquipableByEpicHero && keywordNameInIds([...keywordIds], "Epic Hero")) {
      messages.push(unitValidationMessage("enhancement.epic_hero_not_allowed", unit, `${targetName} cannot take ${enhancement.name} as an Epic Hero.`, targetScope(miniature)));
    }
    if (!enhancement.isEquipableByNonCharacterUnit && !keywordNameInIds([...keywordIds], "Character")) {
      messages.push(unitValidationMessage("enhancement.unit_does_not_have_required_keywords", unit, `${targetName} does not have the required Character keyword for ${enhancement.name}.`, targetScope(miniature)));
    }
    if (!enhancementRequiredKeywordsSatisfied(enhancement.id, unit, [...keywordIds], roster)) {
      messages.push(unitValidationMessage("enhancement.model_does_not_have_required_keywords", unit, `${targetName} does not have the required keywords for ${enhancement.name}.`, targetScope(miniature)));
    }
    const excluded = enhancementExcludedKeywordNames(enhancement.id, [...keywordIds]);
    if (excluded.length) {
      messages.push(unitValidationMessage("enhancement.model_must_not_have_excluded_keywords", unit, `${targetName} cannot take ${enhancement.name} with keyword ${excluded.join(", ")}.`, targetScope(miniature)));
    }
    for (const row of state.catalog.enhancementRequiredWargearItemsByEnhancementId.get(enhancement.id) || []) {
      if (!unitHasWargearItem(unit, row.wargearItemId, miniature)) {
        const itemName = state.catalog.wargearItemById.get(row.wargearItemId)?.name || "required wargear";
        messages.push(unitValidationMessage("enhancement.model_does_not_have_required_wargear", unit, `${targetName} must have ${itemName} for ${enhancement.name}.`, targetScope(miniature)));
      }
    }
    if (!enhancementBodyguardRequirementSatisfied(roster, unit, enhancement.id, units)) {
      messages.push(unitValidationMessage("enhancement.attached_requirement_missing", unit, `${unit.name} does not meet the attached-unit requirement for ${enhancement.name}.`));
    }
    if (enhancement.cannotBeWarlord && enhancementBlocksWarlordTarget(unit, miniature, targetKind)) {
      messages.push(unitValidationMessage("warlord.invalid_due_to_enhancement", unit, `${targetName} cannot be your Warlord with ${enhancement.name}.`, targetScope(miniature)));
    }
  }
  validateAttachedUnitEnhancementLimits(roster, units, messages);
  validateCombatPatrolEnhancements(detachments, selected, messages);
}

export { enhancementCandidateStatus, validateEnhancements };
