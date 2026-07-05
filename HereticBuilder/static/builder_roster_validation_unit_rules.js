import {
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  factionExcludesDatasheet,
} from "./builder_model.js";
import { state } from "./builder_state.js";
import { duplicateLimitForUnit, rosterSummary } from "./builder_validation_core.js";
import { unitValidationMessage, validationWarning } from "./builder_validation_messages.js";
import { validateSuccessorChapterEpicHeroes } from "./builder_restriction_rules.js";

function validateRosterUnitRules(roster, context, messages) {
  const { duplicateLimit, units } = context;
  const counts = {};
  const firstByDatasheet = new Map();
  for (const unit of units) {
    counts[unit.datasheetId] = (counts[unit.datasheetId] || 0) + 1;
    if (!firstByDatasheet.has(unit.datasheetId)) {
      firstByDatasheet.set(unit.datasheetId, unit);
    }
    const datasheet = state.catalog.datasheetById.get(unit.datasheetId);
    if (datasheetIsCombatPatrol(datasheet)) {
      messages.push(unitValidationMessage("roster.combat_patrol_datasheet", unit, `${unit.name} is a Combat Patrol datasheet and cannot be used in roster builder.`));
    }
    const isFactionExcluded = factionExcludesDatasheet(roster.factionKeywordId, unit.datasheetId);
    if ((unit.allyType || "native") === "native") {
      if (!isFactionExcluded && !datasheetIsNativeToFaction(roster.factionKeywordId, unit.datasheetId)) {
        messages.push(unitValidationMessage("roster.unit_not_native", unit, `${unit.name} is not native to ${rosterSummary(roster).factionName}.`));
      }
    }
    if (isFactionExcluded) {
      messages.push(unitValidationMessage("roster.faction_datasheet_not_allowed", unit, `${unit.name} is excluded from ${rosterSummary(roster).factionName} rosters.`));
    }
  }
  for (const [datasheetId, count] of Object.entries(counts)) {
    const unit = firstByDatasheet.get(datasheetId);
    const effectiveLimit = duplicateLimitForUnit(unit, duplicateLimit);
    if (count > effectiveLimit) {
      messages.push(unitValidationMessage("roster.unit_limit_exceeded", unit, `${unit.name} has ${count} units; limit is ${effectiveLimit}.`));
    }
  }
  validateSuccessorChapterEpicHeroes(units, messages);

  if (!units.length) {
    messages.push(validationWarning("roster.empty", "Roster has no units."));
  }
}

export { validateRosterUnitRules };
