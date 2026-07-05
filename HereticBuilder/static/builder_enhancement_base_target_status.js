import { namesForIds } from "./builder_model.js";
import { state } from "./builder_state.js";
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

function enhancementBaseTargetStatus({ detachments = [], unit, enhancement, keywordIds = [], miniature = null, targetKind = "unit" }) {
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
  return null;
}

export {
  detachmentNames,
  enhancementBaseTargetStatus,
  enhancementBlocksWarlordTarget,
};
