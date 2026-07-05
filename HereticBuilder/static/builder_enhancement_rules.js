import { state } from "./builder_state.js";
import {
  compositionFactionIds,
  idsFromRows,
  miniatureKeywordIds,
  namesForIds,
  selectedMiniatureEnhancements,
  selectedUnitEnhancements,
} from "./builder_model.js";
import { keywordNameInIds, unitHasWargearItem } from "./builder_validation_core.js";
import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";
import { enhancementBodyguardRequirementSatisfied, validateAttachedUnitEnhancementLimits } from "./builder_attachment_rules.js";

function enhancementRequiredKeywordsSatisfied(enhancementId, unit, targetKeywordIds, roster) {
  const groups = state.catalog.enhancementRequiredKeywordGroupsByEnhancementId.get(enhancementId) || [];
  if (!groups.length) {
    return true;
  }
  const targetSet = new Set(targetKeywordIds || []);
  for (const group of groups) {
    if (group.datasheetId && group.datasheetId !== unit.datasheetId) {
      continue;
    }
    const keywordIds = idsFromRows(
      state.catalog.enhancementRequiredKeywordGroupKeywordsByGroupId.get(group.id),
      "keywordId"
    );
    const factionIds = idsFromRows(
      state.catalog.enhancementRequiredKeywordGroupFactionsByGroupId.get(group.id),
      "factionKeywordId"
    );
    if (keywordIds.length && !keywordIds.every((id) => targetSet.has(id))) {
      continue;
    }
    const allowedFactionIds = new Set([...compositionFactionIds(roster, unit.allyType), ...(unit.factionKeywordIds || [])]);
    if (factionIds.length && !factionIds.some((id) => allowedFactionIds.has(id))) {
      continue;
    }
    return true;
  }
  return false;
}

function enhancementExcludedKeywordNames(enhancementId, keywordIds) {
  const target = new Set(keywordIds || []);
  return (state.catalog.enhancementExcludedKeywordsByEnhancementId.get(enhancementId) || [])
    .filter((row) => target.has(row.keywordId))
    .map((row) => state.catalog.keywordById.get(row.keywordId)?.name || "keyword")
    .sort((left, right) => left.localeCompare(right));
}

function detachmentNames(detachmentIds) {
  return namesForIds(state.catalog.detachmentById, detachmentIds, "required detachment");
}

function enhancementBlocksWarlordTarget(unit, miniature, targetKind) {
  if (targetKind === "miniature") {
    return Boolean(miniature?.isWarlord);
  }
  return Boolean(unit.isWarlord);
}

function targetScope(miniature) {
  const targetId = miniature?.rosterUnitMiniatureId || miniature?.id || miniature?.miniatureId || "";
  return targetId ? { targetId } : {};
}

function unitIdsScope(items) {
  const unitIds = [...new Set(items.map((item) => item.unit?.id).filter(Boolean))];
  return unitIds.length ? { unitIds } : null;
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
  for (const row of state.catalog.enhancementRequiredWargearItemsByEnhancementId.get(enhancement.id) || []) {
    if (!unitHasWargearItem(unit, row.wargearItemId, miniature)) {
      const itemName = state.catalog.wargearItemById.get(row.wargearItemId)?.name || "required wargear";
      return { eligible: false, reason: `requires ${itemName}` };
    }
  }
  if (!enhancementBodyguardRequirementSatisfied(roster, unit, enhancement.id, units)) {
    return { eligible: false, reason: "attached unit required" };
  }
  if (enhancement.cannotBeWarlord && enhancementBlocksWarlordTarget(unit, miniature, targetKind)) {
    return { eligible: false, reason: "cannot be Warlord" };
  }
  return { eligible: true, reason: "" };
}

function validateCombatPatrolEnhancements(detachments, selected, messages) {
  const combatPatrols = detachments.filter((detachment) => detachment.isCombatPatrol);
  if (!combatPatrols.length) {
    return;
  }
  const selectedById = new Map();
  for (const item of selected) {
    if (!selectedById.has(item.enhancement.id)) {
      selectedById.set(item.enhancement.id, []);
    }
    selectedById.get(item.enhancement.id).push(item);
  }
  for (const detachment of combatPatrols) {
    const defaults = state.catalog.enhancements.filter((enhancement) => (
      enhancement.detachmentId === detachment.id && enhancement.isCombatPatrolDefault
    ));
    const defaultIds = new Set(defaults.map((enhancement) => enhancement.id));
    for (const enhancement of defaults) {
      const selectedDefaults = selectedById.get(enhancement.id) || [];
      const count = selectedDefaults.length;
      if (count === 0) {
        messages.push(validationMessage(
          "enhancement.combat_patrol_required",
          `${detachment.name} requires ${enhancement.name} as its Combat Patrol enhancement.`,
          "error",
          { detachmentId: detachment.id }
        ));
      } else if (count > 1) {
        messages.push(validationMessage(
          "enhancement.combat_patrol_multiple_selected",
          `${enhancement.name} selected ${count} times; Combat Patrol requires it exactly once.`,
          "error",
          unitIdsScope(selectedDefaults)
        ));
      }
    }
    for (const item of selected) {
      if (item.enhancement.detachmentId === detachment.id && !defaultIds.has(item.enhancement.id)) {
        messages.push(validationMessage(
          "enhancement.combat_patrol_not_allowed",
          `${item.enhancement.name} is not the Combat Patrol enhancement for ${detachment.name}.`,
          "error",
          unitIdsScope([item])
        ));
      }
    }
  }
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
  const included = selected.filter((item) => item.enhancement.isIncludedInEnhancementLimit);
  const limit = state.catalog.battleSizeById.get(roster.battleSizeId)?.enhancementLimit || 0;
  if (limit && included.length > limit) {
    messages.push(validationMessage(
      "enhancement.roster_has_too_many_enhancements",
      `Roster has ${included.length} enhancements; limit is ${limit}.`,
      "error",
      unitIdsScope(included)
    ));
  }
  const byEnhancement = new Map();
  for (const item of selected) {
    if (!byEnhancement.has(item.enhancement.id)) {
      byEnhancement.set(item.enhancement.id, []);
    }
    byEnhancement.get(item.enhancement.id).push(item);
  }
  for (const [enhancementId, items] of byEnhancement.entries()) {
    const enhancement = state.catalog.enhancementById.get(enhancementId);
    if (enhancement?.limit != null && items.length > enhancement.limit) {
      messages.push(validationMessage(
        "enhancement.models_have_same_enhancements",
        `${enhancement.name} selected ${items.length} times; limit is ${enhancement.limit}.`,
        "error",
        unitIdsScope(items)
      ));
    }
  }
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
