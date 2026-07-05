import { state } from "./builder_state.js";
import {
  factionScope,
  idsFromRows,
  namesForIds,
  setIntersects,
} from "./builder_model.js";
import { validationMessage } from "./builder_validation_messages.js";

function keywordRestrictionGroupFromRow(row) {
  const keywordIds = idsFromRows(state.catalog.keywordRestrictionGroupKeywordsByGroupId.get(row.id), "keywordId");
  const excludedFaction = row.excludedFactionKeywordId ? state.catalog.factionKeywordById.get(row.excludedFactionKeywordId) : null;
  return {
    ...row,
    keywordIds: new Set(keywordIds),
    keywordNames: namesForIds(state.catalog.keywordById, keywordIds, "keyword"),
    excludedFactionKeywordName: excludedFaction?.name || "",
  };
}

function keywordRestrictionGroupIsActive(group, warlordIds) {
  if (!group.keywordIds.size) {
    return false;
  }
  return !group.requiresWarlordMiniatureId || warlordIds.has(group.requiresWarlordMiniatureId);
}

function keywordRestrictedUnits(units, group) {
  const restricted = [];
  for (const unit of units) {
    if (group.excludedFactionKeywordId && (unit.factionKeywordIds || []).some((id) => factionScope(id).includes(group.excludedFactionKeywordId))) {
      continue;
    }
    if (setIntersects(new Set(unit.keywordIds || []), group.keywordIds)) {
      restricted.push(unit);
    }
  }
  return restricted;
}

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
  const groupRows = factionScope(roster.factionKeywordId)
    .flatMap((factionId) => state.catalog.keywordRestrictionGroupsByFactionId.get(factionId) || []);
  const groups = new Map(groupRows.map((row) => [row.id, keywordRestrictionGroupFromRow(row)]));
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
      let group = groups.get(row.restrictionGroupId);
      if (!group) {
        const source = state.catalog.keywordRestrictionGroups.find((item) => item.id === row.restrictionGroupId);
        group = source ? keywordRestrictionGroupFromRow(source) : null;
      }
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
