import {
  factionScope,
  idsFromRows,
  namesForIds,
} from "./builder_model.js";
import { state } from "./builder_state.js";

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

export {
  keywordRestrictionGroupById,
  keywordRestrictionGroupsForFaction,
};
