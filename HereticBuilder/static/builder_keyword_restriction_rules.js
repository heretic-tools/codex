import { state } from "./builder_state.js";
import {
  addKeywordLimitMessage,
  unitIdsScope,
} from "./builder_keyword_restriction_messages.js";
import {
  keywordRestrictedUnits,
  keywordRestrictionGroupById,
  keywordRestrictionGroupIsActive,
  keywordRestrictionGroupsForFaction,
} from "./builder_keyword_restriction_groups.js";
import { validationMessage } from "./builder_validation_messages.js";

function validateKeywordRestrictions(roster, detachments, units, messages) {
  const groups = keywordRestrictionGroupsForFaction(roster.factionKeywordId);
  const warlordIds = new Set(units.flatMap((unit) => unit.warlordMiniatureIds || []));
  for (const group of groups.values()) {
    if (!keywordRestrictionGroupIsActive(group, warlordIds)) {
      continue;
    }
    const affectedUnits = keywordRestrictedUnits(units, group);
    const count = affectedUnits.length;
    if (group.limit != null && count > group.limit) {
      addKeywordLimitMessage(messages, group, count, group.limit, null, affectedUnits);
    }
  }
  for (const detachment of detachments) {
    for (const row of state.catalog.restrictionGroupDetachmentLimitsByDetachmentId.get(detachment.id) || []) {
      const group = groups.get(row.restrictionGroupId) || keywordRestrictionGroupById(row.restrictionGroupId);
      if (!group || !keywordRestrictionGroupIsActive(group, warlordIds)) {
        continue;
      }
      const affectedUnits = keywordRestrictedUnits(units, group);
      const count = affectedUnits.length;
      if (row.minRosterLimit != null && count < row.minRosterLimit) {
        messages.push(validationMessage(
          "keyword_restriction_group.minimum_not_met",
          `${detachment.name} requires at least ${row.minRosterLimit} ${group.keywordNames.join(", ")} unit(s).`,
          "error",
          unitIdsScope(affectedUnits, { detachmentId: detachment.id })
        ));
      }
      if (row.maxRosterLimit != null && count > row.maxRosterLimit) {
        addKeywordLimitMessage(messages, group, count, row.maxRosterLimit, detachment, affectedUnits);
      }
    }
  }
}

export { validateKeywordRestrictions };
