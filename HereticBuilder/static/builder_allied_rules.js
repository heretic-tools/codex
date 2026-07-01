import { state } from "./builder_state.js";
import { idsFromRows, namesForIds, unique } from "./builder_model.js";
import { rosterSummary } from "./builder_validation_core.js";
import { validationMessage } from "./builder_validation_messages.js";

function alliedFactionName(alliedFactionId) {
  const parentNames = (state.catalog.alliedFactionParentsByAlliedFactionId.get(alliedFactionId) || [])
    .map((row) => state.catalog.factionKeywordById.get(row.factionKeywordId)?.name)
    .filter(Boolean);
  return parentNames.length ? parentNames.join(", ") : "Allied";
}

function miniatureNames(miniatureIds) {
  return namesForIds(state.catalog.miniatureById, miniatureIds, "required model");
}

function detachmentNames(detachmentIds) {
  return namesForIds(state.catalog.detachmentById, detachmentIds, "required detachment");
}

function alliedFactionParentMatches(alliedFactionId, factionKeywordId) {
  if (!factionKeywordId) {
    return true;
  }
  return (state.catalog.alliedFactionParentsByAlliedFactionId.get(alliedFactionId) || [])
    .some((row) => row.factionKeywordId === factionKeywordId);
}

function slotlessAlliedKeywordCount(alliedFactionKeywordId, units) {
  let slotless = 0;
  for (const group of state.catalog.alliedFactionKeywordSlotlessGroupsByKeywordId.get(alliedFactionKeywordId) || []) {
    const donorKeywords = new Set(idsFromRows(
      state.catalog.alliedFactionKeywordSlotlessDonorsByGroupId.get(group.id),
      "keywordId"
    ));
    const receiverKeywords = new Set(idsFromRows(
      state.catalog.alliedFactionKeywordSlotlessReceiversByGroupId.get(group.id),
      "keywordId"
    ));
    if (!donorKeywords.size || !receiverKeywords.size) {
      continue;
    }
    const donorCount = units.filter((unit) => {
      const ids = new Set(unit.keywordIds || []);
      return [...donorKeywords].every((id) => ids.has(id));
    }).length;
    const receiverCount = units.filter((unit) => {
      const ids = new Set(unit.keywordIds || []);
      return [...receiverKeywords].every((id) => ids.has(id));
    }).length;
    slotless += Math.min(donorCount, receiverCount);
  }
  return slotless;
}

function validateAlliedKeywordLimits(roster, alliedFactionId, label, units, warlordIds, messages) {
  let activeKeywordCounts = 0;
  for (const row of state.catalog.alliedFactionKeywordsByAlliedFactionId.get(alliedFactionId) || []) {
    if (row.battleSizeId && row.battleSizeId !== roster.battleSizeId) {
      continue;
    }
    if (row.requiredWarlordMiniatureId && !warlordIds.has(row.requiredWarlordMiniatureId)) {
      continue;
    }
    let count = units.filter((unit) => (unit.keywordIds || []).includes(row.keywordId)).length;
    count = Math.max(0, count - slotlessAlliedKeywordCount(row.id, units));
    if (count) {
      activeKeywordCounts += 1;
    }
    if (count > row.limitCount) {
      const keywordName = state.catalog.keywordById.get(row.keywordId)?.name || "keyword";
      messages.push(validationMessage("allied_keyword_count.limit_exceeded", `${label} allies with ${keywordName} have ${count} units; limit is ${row.limitCount}.`));
    }
  }
  const alliedFaction = state.catalog.alliedFactionById.get(alliedFactionId);
  if (alliedFaction?.isMutuallyExclusiveKeywordLimit && activeKeywordCounts > 1) {
    messages.push(validationMessage("allied_keyword_count.invalid_mutually_exclusive_keywords", `${label} allied keyword limits are mutually exclusive.`));
  }
}

function validateAlliedRequiredAllegianceAbilities(alliedFactionId, label, units, messages) {
  for (const row of state.catalog.alliedFactionAllegianceAbilitiesByAlliedFactionId.get(alliedFactionId) || []) {
    const selectedIds = new Set(units.flatMap((unit) => (unit.allegianceAbilities || []).map((ability) => ability.id)));
    if (!selectedIds.has(row.allegianceAbilityId)) {
      const ability = state.catalog.allegianceAbilityById.get(row.allegianceAbilityId);
      const group = ability ? state.catalog.allegianceAbilityGroupById.get(ability.allegianceAbilityGroupId) : null;
      messages.push(validationMessage("allied_unit.required_allegiance_ability_missing", `${label} allies must select ${ability?.name || "required ability"} from ${group?.name || "its group"}.`));
    }
  }
}

function validateAllyRestrictingKeywords(alliedFactionId, label, units, messages) {
  const rows = [];
  for (const row of state.catalog.keywordAllyRestrictingKeywords || []) {
    const keyword = state.catalog.keywordById.get(row.keywordId);
    if (alliedFactionParentMatches(alliedFactionId, keyword?.allyRestrictingFactionKeywordId)) {
      rows.push(row);
    }
  }
  for (const keyword of state.catalog.keywords || []) {
    if (!keyword.allyRestrictingKeywordId) {
      continue;
    }
    if (alliedFactionParentMatches(alliedFactionId, keyword.allyRestrictingFactionKeywordId)) {
      rows.push({
        keywordId: keyword.id,
        restrictingKeywordId: keyword.allyRestrictingKeywordId,
      });
    }
  }
  const seen = new Set();
  for (const row of rows) {
    const key = `${row.keywordId}:${row.restrictingKeywordId}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const unrestricted = units.filter((unit) => (
      (unit.keywordIds || []).includes(row.keywordId)
      && !(unit.keywordIds || []).includes(row.restrictingKeywordId)
    ));
    const restricting = units.filter((unit) => (
      (unit.keywordIds || []).includes(row.keywordId)
      && (unit.keywordIds || []).includes(row.restrictingKeywordId)
    ));
    if (unrestricted.length > restricting.length) {
      const keywordName = state.catalog.keywordById.get(row.keywordId)?.name || "keyword";
      const restrictingName = state.catalog.keywordById.get(row.restrictingKeywordId)?.name || "restricting keyword";
      messages.push(validationMessage(
        "allied_keyword_restricting_keyword.outnumbered_keywords",
        `${label} allies with ${keywordName} but not ${restrictingName} have ${unrestricted.length} units; limit is ${restricting.length}.`
      ));
    }
  }
}

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
    const allowed = (state.catalog.factionAlliedFactionsByFactionId.get(roster.factionKeywordId) || [])
      .some((row) => row.alliedFactionId === alliedFactionId);
    if (!allowed) {
      messages.push(validationMessage("allied_faction.not_available", `${label} allies are not available to ${rosterSummary(roster).factionName}.`));
    }
    const alliedFaction = state.catalog.alliedFactionById.get(alliedFactionId);
    if (alliedFaction?.requiredWarlordMiniatureId && !warlordIds.has(alliedFaction.requiredWarlordMiniatureId)) {
      messages.push(validationMessage(
        "allied_units.required_warlord_missing",
        `Your Warlord must be ${miniatureNames([alliedFaction.requiredWarlordMiniatureId])[0]} to include ${label} allies.`
      ));
    }
    const allowedWarlords = idsFromRows(
      state.catalog.alliedFactionAllowedWarlordsByAlliedFactionId.get(alliedFactionId),
      "miniatureId"
    );
    if (allowedWarlords.length && !allowedWarlords.some((id) => warlordIds.has(id))) {
      messages.push(validationMessage("allied_units.required_warlord_missing", `Your Warlord must be one of these models to include ${label} allies: ${miniatureNames(allowedWarlords).join(", ")}.`));
    }
    const requiredDetachments = unique([
      alliedFaction?.requiredDetachmentId,
      ...idsFromRows(state.catalog.alliedFactionRequiredDetachmentsByAlliedFactionId.get(alliedFactionId), "detachmentId"),
    ]);
    if (requiredDetachments.length && !requiredDetachments.some((id) => detachmentIds.has(id))) {
      messages.push(validationMessage("allied_unit.required_detachment_not_selected", `${label} allies require one of these detachments: ${detachmentNames(requiredDetachments).join(", ")}.`));
    }
    const allowedDatasheets = new Set(idsFromRows(
      state.catalog.alliedFactionDatasheetsByAlliedFactionId.get(alliedFactionId),
      "datasheetId"
    ));
    for (const unit of items) {
      if (!allowedDatasheets.has(unit.datasheetId)) {
        messages.push(validationMessage("allied_faction.datasheet_not_allowed", `${unit.name} is not allowed for ${label} allies.`));
      }
    }
    const pointsLimit = (state.catalog.alliedFactionPointsLimitsByAlliedFactionId.get(alliedFactionId) || [])
      .find((row) => row.battleSizeId === roster.battleSizeId);
    if (pointsLimit) {
      const total = items.reduce((sum, unit) => sum + (unit.points || 0), 0);
      if (total > pointsLimit.pointsLimit) {
        messages.push(validationMessage("allied_points.limit_exceeded", `${label} allies use ${total} points; limit is ${pointsLimit.pointsLimit}.`));
      }
    }
    validateAlliedKeywordLimits(roster, alliedFactionId, label, items, warlordIds, messages);
    validateAlliedRequiredAllegianceAbilities(alliedFactionId, label, items, messages);
    validateAllyRestrictingKeywords(alliedFactionId, label, items, messages);
  }
}

export { validateAlliedUnits };
