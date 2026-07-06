import { state } from "./builder_state.js";
import { keywordNameInIds } from "./builder_validation_core.js";
import { unitValidationMessage } from "./builder_validation_messages.js";
import { detachmentNames } from "./builder_enhancement_eligibility.js";
import { targetScope } from "./builder_enhancement_selection.js";

function validateSelectedEnhancementBaseTarget(detachmentIds, item, messages) {
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
}

export { validateSelectedEnhancementBaseTarget };
