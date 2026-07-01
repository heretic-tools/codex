import { state } from "./builder_state.js";
import { validateWargearLoadouts } from "./builder_wargear_rules.js";
import {
  costForDetachment,
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  detachmentAllowed,
  factionExcludesDatasheet,
  rosterUnitSummaries,
} from "./builder_model.js";
import { duplicateLimitForUnit, rosterSummary } from "./builder_validation_core.js";
import { validateAllegianceAbilities } from "./builder_allegiance_rules.js";
import { validateAlliedUnits } from "./builder_allied_rules.js";
import { validateAttachedUnits } from "./builder_attachment_rules.js";
import { validateEnhancements } from "./builder_enhancement_rules.js";
import { validateWarlord } from "./builder_warlord_rules.js";
import {
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
} from "./builder_restriction_rules.js";

function validateRoster(roster) {
  const messages = [];
  const size = state.catalog.battleSizeById.get(roster.battleSizeId);
  const detachmentIds = roster.detachmentIds || [];
  const detachments = detachmentIds
    .map((id) => state.catalog.detachmentById.get(id))
    .filter(Boolean);
  const detachmentPoints = detachmentIds.reduce((total, id) => (
    total + costForDetachment(id, roster.factionKeywordId)
  ), 0);
  const units = rosterUnitSummaries(roster);
  const totalPoints = units.reduce((total, unit) => total + (unit.points || 0), 0);

  if (!detachmentIds.length) {
    messages.push({ level: "error", text: "Pick a detachment." });
  }
  for (const detachmentId of detachmentIds) {
    const detachment = state.catalog.detachmentById.get(detachmentId);
    if (!detachmentAllowed(detachmentId, roster.factionKeywordId)) {
      messages.push({ level: "error", text: `${detachment?.name || "Detachment"} is not available to this faction.` });
    }
  }
  const detachmentLimit = size?.detachmentPointsLimit || 0;
  if (detachmentLimit && detachmentPoints > detachmentLimit) {
    messages.push({ level: "error", text: `Roster uses ${detachmentPoints} detachment points; limit is ${detachmentLimit}.` });
  }
  const pointsLimit = size?.pointsLimit || 0;
  if (pointsLimit && totalPoints > pointsLimit) {
    messages.push({ level: "error", text: `Roster is ${totalPoints - pointsLimit} points over the ${pointsLimit} point limit.` });
  }
  validateDetachmentUniqueKeywords(detachments, messages);
  validateWarlord(roster, detachments, units, messages);
  validateAllegianceAbilities(roster, detachments, units, messages);
  validateAlliedUnits(roster, detachments, units, messages);
  validateEnhancements(roster, detachments, units, messages);
  validateAttachedUnits(roster, detachments, units, messages);
  validateDetachmentDatasheets(detachments, units, messages);
  validateKeywordRestrictions(roster, detachments, units, messages);
  validateUnitCompositions(units, messages);
  validateWargearLoadouts(units, messages);

  const duplicateLimit = size?.duplicateUnitLimit || 3;
  const counts = {};
  const firstByDatasheet = new Map();
  for (const unit of units) {
    counts[unit.datasheetId] = (counts[unit.datasheetId] || 0) + 1;
    if (!firstByDatasheet.has(unit.datasheetId)) {
      firstByDatasheet.set(unit.datasheetId, unit);
    }
    const datasheet = state.catalog.datasheetById.get(unit.datasheetId);
    if (datasheetIsCombatPatrol(datasheet)) {
      messages.push({ level: "error", text: `${unit.name} is a Combat Patrol datasheet and cannot be used in roster builder.` });
    }
    const isFactionExcluded = factionExcludesDatasheet(roster.factionKeywordId, unit.datasheetId);
    if ((unit.allyType || "native") === "native") {
      if (!isFactionExcluded && !datasheetIsNativeToFaction(roster.factionKeywordId, unit.datasheetId)) {
        messages.push({ level: "error", text: `${unit.name} is not native to ${rosterSummary(roster).factionName}.` });
      }
    }
    if (isFactionExcluded) {
      messages.push({ level: "error", text: `${unit.name} is excluded from ${rosterSummary(roster).factionName} rosters.` });
    }
  }
  for (const [datasheetId, count] of Object.entries(counts)) {
    const unit = firstByDatasheet.get(datasheetId);
    const effectiveLimit = duplicateLimitForUnit(unit, duplicateLimit);
    if (count > effectiveLimit) {
      messages.push({ level: "error", text: `${unit.name} has ${count} units; limit is ${effectiveLimit}.` });
    }
  }
  validateSuccessorChapterEpicHeroes(units, messages);

  if (!units.length) {
    messages.push({ level: "warning", text: "Roster has no units." });
  }
  return {
    state: messages.some((item) => item.level === "error") ? "invalid" : "valid",
    messages,
    points: {
      total: totalPoints,
      limit: pointsLimit,
      detachmentPoints,
      detachments,
    },
  };
}

export { rosterSummary, validateRoster };
