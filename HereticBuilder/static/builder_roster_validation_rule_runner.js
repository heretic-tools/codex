import { validateWargearLoadouts } from "./builder_wargear_rules.js";
import { validateAllegianceAbilities } from "./builder_allegiance_rules.js";
import { validateAlliedUnits } from "./builder_allied_rules.js";
import { validateAttachedUnits } from "./builder_attachment_rules.js";
import { validateEnhancements } from "./builder_enhancement_rules.js";
import { validateWarlord } from "./builder_warlord_rules.js";
import {
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateUnitCompositions,
} from "./builder_restriction_rules.js";

function runRosterRuleValidators(roster, context, messages) {
  const { detachments, units } = context;
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
}

export { runRosterRuleValidators };
