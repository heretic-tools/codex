import { state } from "./builder_state.js";
import { idsFromRows, selectedMiniatureEnhancements, selectedUnitEnhancements, setIntersects } from "./builder_model.js";
import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";

function attachedGroups(roster) {
  return roster.attachments || [];
}

function attachedUnitCanAttach(roster, detachmentIds, attached, bodyguard, units) {
  const rows = (state.catalog.datasheetBodyguardGroupsByDatasheetId.get(attached.datasheetId) || [])
    .filter((row) => row.bodyguardType === attached.attachmentType);
  const detachmentSet = new Set(detachmentIds);
  for (const row of rows) {
    if (row.factionKeywordId && row.factionKeywordId !== roster.factionKeywordId) {
      continue;
    }
    if (row.excludedDetachmentId && detachmentSet.has(row.excludedDetachmentId)) {
      continue;
    }
    if (row.requiredDetachmentId && !detachmentSet.has(row.requiredDetachmentId)) {
      continue;
    }
    const datasheets = new Set(idsFromRows(
      state.catalog.datasheetBodyguardGroupDatasheetsByGroupId.get(row.id),
      "datasheetId"
    ));
    const keywordIds = new Set(idsFromRows(
      state.catalog.datasheetBodyguardGroupKeywordsByGroupId.get(row.id),
      "keywordId"
    ));
    if (datasheets.size && !datasheets.has(bodyguard.datasheetId)) {
      continue;
    }
    if (keywordIds.size && !setIntersects(new Set(bodyguard.keywordIds || []), keywordIds)) {
      continue;
    }
    if (row.requiresAllUnitsHaveKeywordId) {
      if (!(attached.keywordIds || []).includes(row.requiresAllUnitsHaveKeywordId)) {
        continue;
      }
      if (!(bodyguard.keywordIds || []).includes(row.requiresAllUnitsHaveKeywordId)) {
        continue;
      }
    }
    return Boolean(units);
  }
  return false;
}

function validateAttachedUnits(roster, detachments, units, messages) {
  const groups = attachedGroups(roster);
  if (!groups.length) {
    return;
  }
  const membership = new Map();
  for (const group of groups) {
    for (const member of group.members || []) {
      if (!membership.has(member.rosterUnitId)) {
        membership.set(member.rosterUnitId, new Set());
      }
      membership.get(member.rosterUnitId).add(group.id);
    }
  }
  for (const [rosterUnitId, groupIds] of membership.entries()) {
    if (groupIds.size > 1) {
      const unit = units.find((item) => item.id === rosterUnitId);
      messages.push(unitValidationMessage("attached_unit.duplicate_membership", unit, `${unit?.name || "Unit"} is part of more than one attached unit.`, {
        attachmentIds: [...groupIds],
      }));
    }
  }
  const detachmentIds = detachments.map((detachment) => detachment.id);
  for (const group of groups) {
    const members = (group.members || []).map((member) => ({
      ...member,
      ...(units.find((unit) => unit.id === member.rosterUnitId) || {}),
    }));
    const bodyguards = members.filter((member) => member.attachmentType === "bodyguard");
    const attachedModels = members.filter((member) => member.attachmentType === "leader" || member.attachmentType === "support");
    if (!bodyguards.length && attachedModels.length) {
      for (const attached of attachedModels) {
        messages.push(unitValidationMessage("attached_unit.must_be_attached", attached, `${attached.name} must be attached to a bodyguard unit.`, {
          attachmentId: group.id,
        }));
      }
      continue;
    }
    if (!bodyguards.length || !attachedModels.length) {
      messages.push(validationMessage(
        "attached_unit.incomplete",
        `Attached unit ${group.id} is incomplete.`,
        "error",
        { attachmentId: group.id }
      ));
      continue;
    }
    const bodyguard = bodyguards[0];
    for (const attached of attachedModels) {
      if (!attachedUnitCanAttach(roster, detachmentIds, attached, bodyguard, units)) {
        messages.push(validationMessage(
          "attached_unit.missing_requirements",
          `${attached.name} cannot attach to ${bodyguard.name} as ${attached.attachmentType}.`,
          "error",
          {
            attachmentId: group.id,
            unitIds: [attached.id, bodyguard.id].filter(Boolean),
            datasheetIds: [attached.datasheetId, bodyguard.datasheetId].filter(Boolean),
          }
        ));
      }
    }
  }
}

function enhancementBodyguardRequirementSatisfied(roster, unit, enhancementId, units) {
  const rows = state.catalog.enhancementBodyguardGroupsByEnhancementId.get(enhancementId) || [];
  if (!rows.length) {
    return true;
  }
  const groups = attachedGroups(roster);
  for (const row of rows) {
    if (row.factionKeywordId && row.factionKeywordId !== roster.factionKeywordId) {
      continue;
    }
    for (const group of groups) {
      const currentMember = (group.members || []).find((member) => (
        member.rosterUnitId === unit.id && member.attachmentType === row.bodyguardType
      ));
      if (!currentMember) {
        continue;
      }
      const bodyguards = (group.members || [])
        .filter((member) => member.attachmentType === "bodyguard")
        .map((member) => units.find((candidate) => candidate.id === member.rosterUnitId))
        .filter(Boolean);
      const allowedDatasheets = new Set(idsFromRows(
        state.catalog.enhancementBodyguardGroupDatasheetsByGroupId.get(row.id),
        "datasheetId"
      ));
      const allowedKeywords = new Set(idsFromRows(
        state.catalog.enhancementBodyguardGroupKeywordsByGroupId.get(row.id),
        "keywordId"
      ));
      for (const bodyguard of bodyguards) {
        if (allowedDatasheets.size && !allowedDatasheets.has(bodyguard.datasheetId)) {
          continue;
        }
        if (!allowedKeywords.size || setIntersects(new Set(bodyguard.keywordIds || []), allowedKeywords)) {
          return true;
        }
      }
    }
  }
  return false;
}

function validateAttachedUnitEnhancementLimits(roster, units, messages) {
  for (const group of attachedGroups(roster)) {
    const enhancementIds = new Set();
    for (const member of group.members || []) {
      const unit = units.find((item) => item.id === member.rosterUnitId);
      for (const enhancement of unit ? selectedUnitEnhancements(unit) : []) {
        enhancementIds.add(enhancement.id);
      }
      for (const enhancement of unit ? selectedMiniatureEnhancements(unit) : []) {
        enhancementIds.add(enhancement.id);
      }
    }
    if (enhancementIds.size > 1) {
      messages.push(validationMessage(
        "enhancement.attached_unit_too_many_enhancements",
        `Attached unit ${group.id} has more than 1 enhancement.`,
        "error",
        {
          attachmentId: group.id,
          unitIds: (group.members || []).map((member) => member.rosterUnitId).filter(Boolean),
        }
      ));
    }
  }
}

export { enhancementBodyguardRequirementSatisfied, validateAttachedUnitEnhancementLimits, validateAttachedUnits };
