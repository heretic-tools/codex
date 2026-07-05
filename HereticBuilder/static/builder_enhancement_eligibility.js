import { enhancementBodyguardRequirementSatisfied } from "./builder_attachment_rules.js";
import {
  detachmentNames,
  enhancementBaseTargetStatus,
  enhancementBlocksWarlordTarget,
} from "./builder_enhancement_base_target_status.js";
import {
  enhancementExcludedKeywordNames,
  enhancementRequiredKeywordsSatisfied,
} from "./builder_enhancement_keyword_rules.js";
import { missingEnhancementRequiredWargearName } from "./builder_enhancement_wargear_rules.js";

function enhancementCandidateStatus({ roster, detachments = [], units = [], unit, enhancement, keywordIds = [], miniature = null, targetKind = "unit" }) {
  const baseStatus = enhancementBaseTargetStatus({ detachments, unit, enhancement, keywordIds, miniature, targetKind });
  if (baseStatus) {
    return baseStatus;
  }
  if (!enhancementRequiredKeywordsSatisfied(enhancement.id, unit, keywordIds, roster)) {
    return { eligible: false, reason: "required keywords missing" };
  }
  const excluded = enhancementExcludedKeywordNames(enhancement.id, keywordIds);
  if (excluded.length) {
    return { eligible: false, reason: `blocked by ${excluded.join(", ")}` };
  }
  const missingWargearName = missingEnhancementRequiredWargearName(enhancement.id, unit, miniature);
  if (missingWargearName) {
    return { eligible: false, reason: `requires ${missingWargearName}` };
  }
  if (!enhancementBodyguardRequirementSatisfied(roster, unit, enhancement.id, units)) {
    return { eligible: false, reason: "attached unit required" };
  }
  if (enhancement.cannotBeWarlord && enhancementBlocksWarlordTarget(unit, miniature, targetKind)) {
    return { eligible: false, reason: "cannot be Warlord" };
  }
  return { eligible: true, reason: "" };
}

export {
  detachmentNames,
  enhancementBlocksWarlordTarget,
  enhancementCandidateStatus,
  enhancementExcludedKeywordNames,
  enhancementRequiredKeywordsSatisfied,
};
