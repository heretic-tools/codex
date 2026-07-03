import { state } from "./builder_state.js";

function costForDetachment(detachmentId, factionKeywordId) {
  const override = state.catalog.detachmentFactionPointCosts.find((row) => (
    row.detachmentId === detachmentId && row.factionKeywordId === factionKeywordId
  ));
  const detachment = state.catalog.detachmentById.get(detachmentId);
  return override?.detachmentPointsCost ?? detachment?.detachmentPointsCost ?? 0;
}

function dispositionSlug(name) {
  return String(name || "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function forceDispositionForDetachment(detachmentId) {
  const link = state.catalog.forceDispositionsByDetachmentId.get(detachmentId)?.[0];
  return link ? state.catalog.forceDispositionById.get(link.forceDispositionId) : null;
}

function detachmentBadgeNode(detachment) {
  const badge = document.createElement("span");
  const disposition = forceDispositionForDetachment(detachment.id);
  const slug = dispositionSlug(disposition?.name);
  badge.className = slug ? `disposition-badge disposition-${slug}` : "meta-badge";
  badge.textContent = detachment.name || "Detachment";
  return badge;
}

function detachmentDispositionBadgeNode(detachment) {
  const disposition = forceDispositionForDetachment(detachment.id);
  if (!disposition?.name) {
    return null;
  }
  const badge = document.createElement("span");
  const slug = dispositionSlug(disposition.name);
  badge.className = slug ? `disposition-badge disposition-${slug}` : "meta-badge";
  badge.textContent = disposition.name;
  return badge;
}

function detachmentDispositionName(detachment) {
  return forceDispositionForDetachment(detachment.id)?.name || "";
}

function factionScope(factionKeywordId) {
  const scope = [];
  const seen = new Set();
  let current = factionKeywordId;
  while (current && !seen.has(current)) {
    seen.add(current);
    scope.push(current);
    current = state.catalog.factionKeywordById.get(current)?.parentFactionKeywordId || "";
  }
  return scope;
}

function factionDescendantIds(factionKeywordId) {
  const result = [];
  const pending = [factionKeywordId];
  const seen = new Set(pending);
  while (pending.length) {
    const parentId = pending.shift();
    for (const faction of state.catalog.factionKeywords) {
      if (faction.parentFactionKeywordId !== parentId || seen.has(faction.id)) {
        continue;
      }
      seen.add(faction.id);
      result.push(faction.id);
      pending.push(faction.id);
    }
  }
  return result;
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function lowerName(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function idsFromRows(rows, key) {
  return (rows || []).map((row) => row[key]).filter(Boolean);
}

function datasheetFactionIds(datasheetId) {
  return idsFromRows(state.catalog.datasheetFactionKeywordsByDatasheetId.get(datasheetId), "factionKeywordId");
}

function setIntersects(left, right) {
  for (const value of left) {
    if (right.has(value)) {
      return true;
    }
  }
  return false;
}

function namesForIds(map, ids, fallback = "item") {
  return (ids || []).map((id) => map.get(id)?.name || fallback);
}

function normalizeSelectedRows(values, byIdMap, options = {}) {
  const allowStringIds = Boolean(options.allowStringIds);
  return (values || [])
    .map((value) => {
      if (typeof value === "string") {
        if (!allowStringIds) {
          return null;
        }
        return byIdMap.get(value) || null;
      }
      if (!value || typeof value !== "object") {
        return null;
      }
      return byIdMap.get(value.id) ? { ...byIdMap.get(value.id), ...value } : value;
    })
    .filter(Boolean);
}

function compositionFactionIds(roster, allyType = "native") {
  if (allyType && allyType !== "native") {
    const parentIds = idsFromRows(
      state.catalog.alliedFactionParentsByAlliedFactionId.get(allyType),
      "factionKeywordId"
    );
    if (parentIds.length) {
      const result = [];
      for (const parentId of parentIds) {
        result.push(...factionScope(parentId));
      }
      return unique(result);
    }
  }
  return factionScope(roster.factionKeywordId);
}

function selectedAllegianceAbilities(unit) {
  return normalizeSelectedRows(unit.allegianceAbilities, state.catalog.allegianceAbilityById, { allowStringIds: true })
    .map((ability) => ({
      ...ability,
      groupId: ability.groupId || ability.allegianceAbilityGroupId,
      groupName: ability.groupName || state.catalog.allegianceAbilityGroupById.get(ability.groupId || ability.allegianceAbilityGroupId)?.name,
    }));
}

function selectedUnitEnhancements(unit) {
  return normalizeSelectedRows(unit.unitEnhancements, state.catalog.enhancementById);
}

function selectedMiniatureEnhancements(unit) {
  const direct = unit.miniatureEnhancements || [];
  return normalizeSelectedRows(direct, state.catalog.enhancementById);
}

function miniatureKeywordIds(miniatureId) {
  return idsFromRows(state.catalog.miniatureKeywordsByMiniatureId.get(miniatureId), "keywordId");
}

function conditionalKeywordApplies(row, roster, detachmentIds, allegianceAbilityIds, warlordMiniatureIds) {
  if (row.requiredWarlordMiniatureId && !warlordMiniatureIds.has(row.requiredWarlordMiniatureId)) {
    return false;
  }
  if (row.requiredAllegianceAbilityId && !allegianceAbilityIds.has(row.requiredAllegianceAbilityId)) {
    return false;
  }
  if (row.requiredRosterFactionKeywordId && !factionScope(roster.factionKeywordId).includes(row.requiredRosterFactionKeywordId)) {
    return false;
  }
  if (row.requiredDetachmentId && !detachmentIds.has(row.requiredDetachmentId)) {
    return false;
  }
  return true;
}

export {
  compositionFactionIds,
  conditionalKeywordApplies,
  costForDetachment,
  datasheetFactionIds,
  detachmentBadgeNode,
  detachmentDispositionBadgeNode,
  detachmentDispositionName,
  factionDescendantIds,
  factionScope,
  idsFromRows,
  lowerName,
  miniatureKeywordIds,
  namesForIds,
  selectedAllegianceAbilities,
  selectedMiniatureEnhancements,
  selectedUnitEnhancements,
  setIntersects,
  unique,
};
