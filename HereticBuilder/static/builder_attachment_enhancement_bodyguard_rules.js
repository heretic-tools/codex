import { state } from "./builder_state.js";
import { attachedGroups } from "./builder_attachment_matchers.js";
import { enhancementBodyguardAllowed } from "./builder_attachment_enhancement_bodyguard_allowed.js";

function matchingBodyguardsForEnhancementGroup(units, group, row) {
  const currentMember = (group.members || []).find((member) => (
    member.rosterUnitId === row.unitId && member.attachmentType === row.bodyguardType
  ));
  if (!currentMember) {
    return [];
  }
  return (group.members || [])
    .filter((member) => member.attachmentType === "bodyguard")
    .map((member) => units.find((candidate) => candidate.id === member.rosterUnitId))
    .filter(Boolean);
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
      const bodyguards = matchingBodyguardsForEnhancementGroup(units, group, {
        ...row,
        unitId: unit.id,
      });
      if (bodyguards.some((bodyguard) => enhancementBodyguardAllowed(bodyguard, row.id))) {
        return true;
      }
    }
  }
  return false;
}

export { enhancementBodyguardRequirementSatisfied };
