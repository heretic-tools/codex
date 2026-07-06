import {
  factionScope,
  setIntersects,
} from "./builder_model.js";
export {
  keywordRestrictionGroupById,
  keywordRestrictionGroupsForFaction,
} from "./builder_keyword_restriction_group_hydration.js";

function keywordRestrictionGroupIsActive(group, warlordIds) {
  if (!group.keywordIds.size) {
    return false;
  }
  return !group.requiresWarlordMiniatureId || warlordIds.has(group.requiresWarlordMiniatureId);
}

function keywordRestrictedUnits(units, group) {
  const restricted = [];
  for (const unit of units) {
    if (group.excludedFactionKeywordId && (unit.factionKeywordIds || []).some((id) => factionScope(id).includes(group.excludedFactionKeywordId))) {
      continue;
    }
    if (setIntersects(new Set(unit.keywordIds || []), group.keywordIds)) {
      restricted.push(unit);
    }
  }
  return restricted;
}

export {
  keywordRestrictedUnits,
  keywordRestrictionGroupIsActive,
};
