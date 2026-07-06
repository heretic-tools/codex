import { unitValidationMessage } from "./builder_validation_messages.js";
import { enhancementBodyguardRequirementSatisfied } from "./builder_attachment_rules.js";
import {
  enhancementBlocksWarlordTarget,
  enhancementExcludedKeywordNames,
  enhancementRequiredKeywordsSatisfied,
} from "./builder_enhancement_eligibility.js";
import { targetScope } from "./builder_enhancement_selection.js";
import { missingEnhancementRequiredWargearName } from "./builder_enhancement_wargear_rules.js";

function validateSelectedEnhancementRequirements(roster, units, item, messages) {
  const { unit, enhancement, keywordIds, targetName, miniature, targetKind } = item;
  if (!enhancementRequiredKeywordsSatisfied(enhancement.id, unit, [...keywordIds], roster)) {
    messages.push(unitValidationMessage("enhancement.model_does_not_have_required_keywords", unit, `${targetName} does not have the required keywords for ${enhancement.name}.`, targetScope(miniature)));
  }
  const excluded = enhancementExcludedKeywordNames(enhancement.id, [...keywordIds]);
  if (excluded.length) {
    messages.push(unitValidationMessage("enhancement.model_must_not_have_excluded_keywords", unit, `${targetName} cannot take ${enhancement.name} with keyword ${excluded.join(", ")}.`, targetScope(miniature)));
  }
  const missingWargearName = missingEnhancementRequiredWargearName(enhancement.id, unit, miniature);
  if (missingWargearName) {
    messages.push(unitValidationMessage("enhancement.model_does_not_have_required_wargear", unit, `${targetName} must have ${missingWargearName} for ${enhancement.name}.`, targetScope(miniature)));
  }
  if (!enhancementBodyguardRequirementSatisfied(roster, unit, enhancement.id, units)) {
    messages.push(unitValidationMessage("enhancement.attached_requirement_missing", unit, `${unit.name} does not meet the attached-unit requirement for ${enhancement.name}.`));
  }
  if (enhancement.cannotBeWarlord && enhancementBlocksWarlordTarget(unit, miniature, targetKind)) {
    messages.push(unitValidationMessage("warlord.invalid_due_to_enhancement", unit, `${targetName} cannot be your Warlord with ${enhancement.name}.`, targetScope(miniature)));
  }
}

export { validateSelectedEnhancementRequirements };
