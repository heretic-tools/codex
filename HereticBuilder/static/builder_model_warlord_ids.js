import { compositionFactionIds } from "./builder_model_selections.js";
import {
  effectiveComposition,
  miniaturesForUnit,
} from "./builder_model_compositions.js";

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

export { rosterWarlordMiniatureIds };
