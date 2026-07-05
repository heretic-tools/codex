import { state } from "./builder_state.js";
import { factionScope, idsFromRows, namesForIds, setIntersects } from "./builder_model.js";
import { unitHasKeyword } from "./builder_validation_core.js";
import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";

function validateDetachmentUniqueKeywords(detachments, messages) {
  if (detachments.length < 2) {
    return;
  }
  const byKeyword = new Map();
  for (const detachment of detachments) {
    for (const row of state.catalog.detachmentUniqueKeywordsByDetachmentId.get(detachment.id) || []) {
      if (!byKeyword.has(row.keywordId)) {
        byKeyword.set(row.keywordId, {
          name: state.catalog.keywordById.get(row.keywordId)?.name || "Unknown",
          detachments: [],
        });
      }
      byKeyword.get(row.keywordId).detachments.push(detachment);
    }
  }
  for (const { name, detachments: items } of byKeyword.values()) {
    if (items.length > 1) {
      messages.push(validationMessage(
        "roster.detachment_unique_keyword_error",
        `Detachments share unique keyword ${name}: ${items.map((detachment) => detachment.name).join(", ")}.`,
        "error",
        { detachmentIds: items.map((detachment) => detachment.id) }
      ));
    }
  }
}

function validateUnitCompositions(units, messages) {
  for (const unit of units) {
    if (unit.maxModelCount && unit.modelCount > unit.maxModelCount) {
      messages.push(unitValidationMessage("unit.max_model_count_too_many_models", unit, `${unit.name} has ${unit.modelCount} models; limit is ${unit.maxModelCount}.`));
    }
    if (!unit.selectedCompositionId) {
      messages.push(unitValidationMessage("unit_composition.invalid_unit_composition", unit, `${unit.name} has an invalid unit composition.`));
    } else if (!unit.selectedCompositionAvailable) {
      messages.push(unitValidationMessage("unit_composition.unavailable", unit, `${unit.name} uses a composition that is not available to this faction or detachment.`));
    }
  }
}

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

function validateDetachmentDatasheets(detachments, units, messages) {
  const counts = {};
  for (const unit of units) {
    counts[unit.datasheetId] = (counts[unit.datasheetId] || 0) + 1;
  }
  for (const detachment of detachments) {
    for (const unit of units) {
      if ((state.catalog.detachmentExcludedDatasheets || []).some((row) => (
        row.detachmentId === detachment.id && row.datasheetId === unit.datasheetId
      ))) {
        messages.push(unitValidationMessage("detachment.datasheet_not_allowed", unit, `${unit.name} is excluded from ${detachment.name}.`, {
          detachmentId: detachment.id,
        }));
      }
    }
    for (const row of state.catalog.detachmentRequiredDatasheetsByDetachmentId.get(detachment.id) || []) {
      const datasheet = state.catalog.datasheetById.get(row.datasheetId);
      if (!counts[row.datasheetId]) {
        messages.push(validationMessage(
          "detachment.datasheets_missing",
          `${detachment.name} requires ${datasheet?.name || "a required unit"}.`,
          "error",
          { detachmentId: detachment.id, datasheetId: row.datasheetId }
        ));
      }
    }
    if (!detachment.isCombatPatrol) {
      continue;
    }
    const linkedRows = state.catalog.detachmentLinkedDatasheetsByDetachmentId.get(detachment.id) || [];
    if (!linkedRows.length) {
      continue;
    }
    const linkedCounts = new Map(linkedRows.map((row) => [row.datasheetId, row.count]));
    for (const linked of linkedRows) {
      const datasheet = state.catalog.datasheetById.get(linked.datasheetId);
      const actual = counts[linked.datasheetId] || 0;
      if (actual !== linked.count) {
        messages.push(validationMessage(
          "detachment.linked_datasheet_count_mismatch",
          `${detachment.name} requires exactly ${linked.count} ${datasheet?.name || "linked"} unit(s); roster has ${actual}.`,
          "error",
          { datasheetId: linked.datasheetId, detachmentId: detachment.id }
        ));
      }
    }
    for (const unit of units) {
      if (!linkedCounts.has(unit.datasheetId)) {
        messages.push(unitValidationMessage("detachment.linked_datasheet_not_allowed", unit, `${unit.name} is not part of ${detachment.name}.`, {
          detachmentId: detachment.id,
        }));
      }
    }
  }
}

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

export {
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
};
