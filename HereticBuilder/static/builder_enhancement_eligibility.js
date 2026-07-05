import { enhancementBodyguardRequirementSatisfied } from "./builder_attachment_rules.js";
import { namesForIds } from "./builder_model.js";
import { state } from "./builder_state.js";
import {
  enhancementExcludedKeywordNames,
  enhancementRequiredKeywordsSatisfied,
} from "./builder_enhancement_keyword_rules.js";
import { missingEnhancementRequiredWargearName } from "./builder_enhancement_wargear_rules.js";
import { keywordNameInIds } from "./builder_validation_core.js";

function detachmentNames(detachmentIds) {
  return namesForIds(state.catalog.detachmentById, detachmentIds, "required detachment");
}

function enhancementBlocksWarlordTarget(unit, miniature, targetKind) {
  if (targetKind === "miniature") {
    return Boolean(miniature?.isWarlord);
  }
  return Boolean(unit.isWarlord);
}

function enhancementCandidateStatus({ roster, detachments = [], units = [], unit, enhancement, keywordIds = [], miniature = null, targetKind = "unit" }) {
  const detachmentIds = new Set(detachments.map((detachment) => detachment.id));
  if (enhancement.detachmentId && !detachmentIds.has(enhancement.detachmentId)) {
    return { eligible: false, reason: `requires ${detachmentNames([enhancement.detachmentId])[0]}` };
  }
  if (targetKind === "miniature" && enhancement.enhancementType !== "miniature") {
    return { eligible: false, reason: "unit target required" };
  }
  if (targetKind === "unit" && enhancement.enhancementType === "miniature") {
    return { eligible: false, reason: "model target required" };
  }
  if ((unit.allyType || "native") !== "native" && state.catalog.alliedFactionById.get(unit.allyType)?.canTakeEnhancements === false) {
    return { eligible: false, reason: "allied unit cannot take enhancements" };
  }
  if (miniature?.excludedFromEnhancements) {
    return { eligible: false, reason: "model cannot take enhancements" };
  }
  if (!enhancement.isEquipableByEpicHero && keywordNameInIds(keywordIds, "Epic Hero")) {
    return { eligible: false, reason: "Epic Hero not allowed" };
  }
  if (!enhancement.isEquipableByNonCharacterUnit && !keywordNameInIds(keywordIds, "Character")) {
    return { eligible: false, reason: "Character required" };
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
