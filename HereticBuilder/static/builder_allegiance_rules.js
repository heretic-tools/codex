import { allegianceAbilityCandidateStatus } from "./builder_allegiance_candidates.js";
import { validateAllegianceGroupLimits } from "./builder_allegiance_group_limits.js";
import { validateMandatoryAllegianceAbilities } from "./builder_allegiance_mandatory_rules.js";
import { validateUnitAllegianceAbilities } from "./builder_allegiance_unit_rules.js";

function validateAllegianceAbilities(roster, detachments, units, messages) {
  const detachmentIds = new Set(detachments.map((detachment) => detachment.id));
  const { groupCounts, groupUnits } = validateUnitAllegianceAbilities(detachmentIds, units, messages);
  validateAllegianceGroupLimits(detachmentIds, groupCounts, groupUnits, messages);
  validateMandatoryAllegianceAbilities(roster, units, messages);
}

export { allegianceAbilityCandidateStatus, validateAllegianceAbilities };
