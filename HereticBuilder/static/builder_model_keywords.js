import { state } from "./builder_state.js";
import {
  miniatureKeywordIds,
} from "./builder_model_core.js";
import {
  compositionFactionIds,
  conditionalKeywordApplies,
} from "./builder_model_selections.js";
import {
  effectiveComposition,
  miniaturesForUnit,
} from "./builder_model_compositions.js";

function conditionalKeywordRowsForUnit(roster, unit, allegianceAbilities, warlordMiniatureIds) {
  const detachmentIds = new Set(roster.detachmentIds || []);
  const allegianceAbilityIds = new Set(allegianceAbilities.map((item) => item.id));
  return (state.catalog.conditionalKeywordsByDatasheetId.get(unit.datasheetId) || [])
    .filter((row) => conditionalKeywordApplies(row, roster, detachmentIds, allegianceAbilityIds, warlordMiniatureIds));
}

function unitKeywords(roster, unit, miniatures, allegianceAbilities, warlordMiniatureIds, conditionalKeywordRows = null) {
  const keywordIds = new Set();
  for (const miniature of miniatures) {
    if ((miniature.count || 0) <= 0) {
      continue;
    }
    for (const keywordId of miniatureKeywordIds(miniature.miniatureId)) {
      keywordIds.add(keywordId);
    }
  }
  if (!keywordIds.size && !miniatures.length) {
    for (const miniature of state.catalog.miniaturesByDatasheetId.get(unit.datasheetId) || []) {
      for (const keywordId of miniatureKeywordIds(miniature.id)) {
        keywordIds.add(keywordId);
      }
    }
  }
  for (const row of conditionalKeywordRows ?? conditionalKeywordRowsForUnit(roster, unit, allegianceAbilities, warlordMiniatureIds)) {
    keywordIds.add(row.keywordId);
  }
  return [...keywordIds]
    .map((id) => state.catalog.keywordById.get(id))
    .filter(Boolean)
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

function rosterWarlordMiniatureIds(roster) {
  const ids = [];
  for (const unit of roster.units || []) {
    const factionIds = compositionFactionIds(roster, unit.allyType || "native");
    const composition = effectiveComposition(unit, factionIds, roster.detachmentIds || []);
    for (const miniature of miniaturesForUnit(unit, composition)) {
      if (miniature.isWarlord && miniature.count > 0) {
        ids.push(miniature.miniatureId);
      }
    }
  }
  return ids;
}

export {
  conditionalKeywordRowsForUnit,
  rosterWarlordMiniatureIds,
  unitKeywords,
};
