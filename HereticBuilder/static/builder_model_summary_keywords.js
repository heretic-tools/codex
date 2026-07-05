import { unique } from "./builder_model_core.js";
import { selectedAllegianceAbilities } from "./builder_model_selections.js";
import {
  conditionalKeywordRowsForUnit,
  rosterWarlordMiniatureIds,
  unitKeywords,
} from "./builder_model_keywords.js";

function summaryKeywordState(roster, unit, miniatures) {
  const selectedAbilities = selectedAllegianceAbilities(unit);
  const ownWarlordMiniatureIds = miniatures
    .filter((item) => item.isWarlord && item.count > 0)
    .map((item) => item.miniatureId);
  const rosterWarlordIds = new Set([...rosterWarlordMiniatureIds(roster), ...ownWarlordMiniatureIds]);
  const conditionalKeywordRows = conditionalKeywordRowsForUnit(roster, unit, selectedAbilities, rosterWarlordIds);
  const conditionalKeywordIds = unique(conditionalKeywordRows.map((item) => item.keywordId));
  const keywords = unitKeywords(roster, unit, miniatures, selectedAbilities, rosterWarlordIds, conditionalKeywordRows);
  return {
    conditionalKeywordIds,
    keywordIds: keywords.map((item) => item.id),
    keywordNames: keywords.map((item) => item.name),
    ownWarlordMiniatureIds,
    selectedAbilities,
  };
}

export { summaryKeywordState };
