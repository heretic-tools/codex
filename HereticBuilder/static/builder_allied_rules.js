import { alliedFactionName } from "./builder_allied_rule_helpers.js";
import { validateAlliedFactionRules } from "./builder_allied_faction_rules.js";
import {
  validateAlliedKeywordLimits,
  validateAlliedRequiredAllegianceAbilities,
  validateAllyRestrictingKeywords,
} from "./builder_allied_keyword_rules.js";

function validateAlliedUnits(roster, detachments, units, messages) {
  const alliedUnits = units.filter((unit) => (unit.allyType || "native") !== "native");
  if (!alliedUnits.length) {
    return;
  }
  const detachmentIds = new Set(detachments.map((detachment) => detachment.id));
  const warlordIds = new Set(units.flatMap((unit) => unit.warlordMiniatureIds || []));
  const byAlly = new Map();
  for (const unit of alliedUnits) {
    if (!byAlly.has(unit.allyType)) {
      byAlly.set(unit.allyType, []);
    }
    byAlly.get(unit.allyType).push(unit);
  }
  for (const [alliedFactionId, items] of byAlly.entries()) {
    const label = alliedFactionName(alliedFactionId);
    validateAlliedFactionRules(roster, alliedFactionId, label, items, detachmentIds, warlordIds, messages);
    validateAlliedKeywordLimits(roster, alliedFactionId, label, items, warlordIds, messages);
    validateAlliedRequiredAllegianceAbilities(alliedFactionId, label, items, messages);
    validateAllyRestrictingKeywords(alliedFactionId, label, items, messages);
  }
}

export { validateAlliedUnits };
