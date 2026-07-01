import { state } from "./builder_state.js";
import { lowerName, selectedWargearEntries } from "./builder_model.js";

function rosterSummary(roster) {
  const faction = state.catalog.factionById.get(roster.factionKeywordId);
  const size = state.catalog.battleSizeById.get(roster.battleSizeId);
  return {
    factionName: faction?.name || "Unknown faction",
    battleSizeName: size?.name || "Unknown size",
    pointsLimit: size?.pointsLimit || 0,
  };
}

function unitHasKeyword(unit, keywordName) {
  const target = lowerName(keywordName);
  return (unit.keywordNames || []).some((name) => lowerName(name) === target);
}

function keywordNameInIds(keywordIds, keywordName) {
  const target = lowerName(keywordName);
  return (keywordIds || []).some((id) => lowerName(state.catalog.keywordById.get(id)?.name) === target);
}

function duplicateLimitForUnit(unit, baseLimit) {
  if (unitHasKeyword(unit, "Epic Hero")) {
    return 1;
  }
  if (unitHasKeyword(unit, "Battleline") || unitHasKeyword(unit, "Dedicated Transport")) {
    return 6;
  }
  return baseLimit;
}

function unitHasWargearItem(unit, wargearItemId, miniature = null) {
  return selectedWargearEntries(unit).some((entry) => {
    const optionRow = state.catalog.wargearOptionById.get(entry.optionId);
    if (!optionRow || optionRow.wargearItemId !== wargearItemId) {
      return false;
    }
    if (!miniature) {
      return true;
    }
    const targetRosterMiniatureId = miniature.rosterUnitMiniatureId || miniature.id || "";
    if (targetRosterMiniatureId && entry.rosterUnitMiniatureId === targetRosterMiniatureId) {
      return true;
    }
    return Boolean(entry.miniatureId && miniature.miniatureId && entry.miniatureId === miniature.miniatureId);
  });
}

export { duplicateLimitForUnit, keywordNameInIds, rosterSummary, unitHasKeyword, unitHasWargearItem };
