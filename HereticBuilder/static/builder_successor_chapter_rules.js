import { factionScope } from "./builder_model.js";
import { state } from "./builder_state.js";
import { unitHasKeyword } from "./builder_validation_core.js";
import { unitValidationMessage } from "./builder_validation_messages.js";

function nonRootFactionScopeIds(factionKeywordIds) {
  const ids = new Set();
  for (const factionKeywordId of factionKeywordIds || []) {
    for (const scopeId of factionScope(factionKeywordId)) {
      if (state.catalog.factionKeywordById.get(scopeId)?.parentFactionKeywordId) {
        ids.add(scopeId);
      }
    }
  }
  return ids;
}

function validateSuccessorChapterEpicHeroes(units, messages) {
  const successorUnits = units.filter((unit) => unit.isSuccessorChapter && unitHasKeyword(unit, "Epic Hero"));
  if (!successorUnits.length) {
    return;
  }
  const epicUnits = units.filter((unit) => unitHasKeyword(unit, "Epic Hero"));
  for (const successor of successorUnits) {
    const successorFactions = nonRootFactionScopeIds(successor.factionKeywordIds);
    const shared = [];
    for (const unit of epicUnits) {
      if (unit.id === successor.id) {
        continue;
      }
      const unitFactions = nonRootFactionScopeIds(unit.factionKeywordIds);
      if ([...unitFactions].some((factionId) => successorFactions.has(factionId))) {
        shared.push(unit.name);
      }
    }
    if (shared.length) {
      messages.push(unitValidationMessage(
        "roster.successor_chapter_epic_hero_in_roster",
        successor,
        `${successor.name} cannot be included with other Epic Heroes from the same parent faction: ${shared.join(", ")}.`
      ));
    }
  }
}

export { validateSuccessorChapterEpicHeroes };
