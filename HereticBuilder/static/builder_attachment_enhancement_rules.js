import { idsFromRows, selectedMiniatureEnhancements, selectedUnitEnhancements, setIntersects } from "./builder_model.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";
import { attachedGroups } from "./builder_attachment_matchers.js";

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

export {
  enhancementBodyguardRequirementSatisfied,
  validateAttachedUnitEnhancementLimits,
};
