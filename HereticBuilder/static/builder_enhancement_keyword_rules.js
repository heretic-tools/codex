import {
  compositionFactionIds,
  idsFromRows,
} from "./builder_model.js";
import { state } from "./builder_state.js";

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

export {
  enhancementExcludedKeywordNames,
  enhancementRequiredKeywordsSatisfied,
};
