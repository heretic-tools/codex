import { state } from "./builder_state.js";
import {
  factionScope,
  idsFromRows,
  namesForIds,
  setIntersects,
} from "./builder_model.js";

function keywordRestrictionGroupFromRow(row) {
  const keywordIds = idsFromRows(state.catalog.keywordRestrictionGroupKeywordsByGroupId.get(row.id), "keywordId");
  const excludedFaction = row.excludedFactionKeywordId ? state.catalog.factionKeywordById.get(row.excludedFactionKeywordId) : null;
  return {
    ...row,
    keywordIds: new Set(keywordIds),
    keywordNames: namesForIds(state.catalog.keywordById, keywordIds, "keyword"),
    excludedFactionKeywordName: excludedFaction?.name || "",
  };
}

function keywordRestrictionGroupsForFaction(factionKeywordId) {
  const groupRows = factionScope(factionKeywordId)
    .flatMap((factionId) => state.catalog.keywordRestrictionGroupsByFactionId.get(factionId) || []);
  return new Map(groupRows.map((row) => [row.id, keywordRestrictionGroupFromRow(row)]));
}

function keywordRestrictionGroupById(restrictionGroupId) {
  const source = state.catalog.keywordRestrictionGroups.find((item) => item.id === restrictionGroupId);
  return source ? keywordRestrictionGroupFromRow(source) : null;
}

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
  keywordRestrictionGroupById,
  keywordRestrictionGroupIsActive,
  keywordRestrictionGroupsForFaction,
};
