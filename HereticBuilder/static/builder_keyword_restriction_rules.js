import { state } from "./builder_state.js";
import {
  keywordRestrictedUnits,
  keywordRestrictionGroupById,
  keywordRestrictionGroupIsActive,
  keywordRestrictionGroupsForFaction,
} from "./builder_keyword_restriction_groups.js";
import { validationMessage } from "./builder_validation_messages.js";

function unitIdsScope(units, extra = {}) {
  const unitIds = [...new Set((units || []).map((unit) => unit.id).filter(Boolean))];
  const scope = { ...extra };
  if (unitIds.length) {
    scope.unitIds = unitIds;
  }
  return Object.keys(scope).length ? scope : null;
}

function addKeywordLimitMessage(messages, group, count, limit, detachment = null, affectedUnits = []) {
  const labels = group.keywordNames.join(", ");
  const scope = detachment ? ` in ${detachment.name}` : "";
  const prefix = group.excludedFactionKeywordName ? `Excluding ${group.excludedFactionKeywordName} units, ` : "";
  const messageScope = unitIdsScope(affectedUnits, detachment ? { detachmentId: detachment.id } : {});
  if (limit === 0) {
    messages.push(validationMessage("keyword_restriction_group.limit_zero", `${prefix}${labels} units are not allowed${scope}.`, "error", messageScope));
  } else {
    messages.push(validationMessage("keyword_restriction_group.limit_exceeded", `${prefix}${labels} has ${count} units${scope}; limit is ${limit}.`, "error", messageScope));
  }
}

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
