import { state } from "./builder_state.js";
import {
  addCounts,
  cleanCounts,
  countKey,
  loadoutChoiceSets,
  validLoadoutsFromChoiceSets,
} from "./builder_loadout_math.js";

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

function normalizeSelectedRows(values, byIdMap) {
  return (values || [])
    .map((value) => {
      if (typeof value === "string") {
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
  return normalizeSelectedRows(unit.allegianceAbilities || unit.allegianceAbilityIds, state.catalog.allegianceAbilityById)
    .map((ability) => ({
      ...ability,
      groupId: ability.groupId || ability.allegianceAbilityGroupId,
      groupName: ability.groupName || state.catalog.allegianceAbilityGroupById.get(ability.groupId || ability.allegianceAbilityGroupId)?.name,
    }));
}

function selectedUnitEnhancements(unit) {
  return normalizeSelectedRows(unit.unitEnhancements || unit.enhancementIds, state.catalog.enhancementById);
}

function selectedMiniatureEnhancements(unit) {
  const direct = unit.miniatureEnhancements || [];
  const fromMiniatures = (unit.miniatures || []).flatMap((miniature) => (
    (miniature.enhancementIds || miniature.enhancements || []).map((enhancement) => ({
      ...(typeof enhancement === "string" ? { id: enhancement } : enhancement),
      targetId: miniature.rosterUnitMiniatureId || miniature.id || `${unit.id}:${miniature.miniatureId}`,
    }))
  ));
  return normalizeSelectedRows([...direct, ...fromMiniatures], state.catalog.enhancementById);
}

function compositionMiniatures(composition) {
  return state.catalog.compositionMiniaturesByCompositionId.get(composition?.id) || [];
}

function miniaturesForUnit(unit, composition) {
  const saved = Array.isArray(unit.miniatures) ? unit.miniatures : [];
  return saved.map((row) => {
    const miniatureId = row.miniatureId || row.id;
    const miniature = state.catalog.miniatureById.get(miniatureId) || {};
    return {
      rosterUnitMiniatureId: row.rosterUnitMiniatureId || row.id || `${unit.id}:${miniatureId}`,
      miniatureId,
      count: Math.max(0, Number(row.count ?? row.min ?? 0)),
      isWarlord: Boolean(row.isWarlord),
      name: row.name || miniature.name || "Model",
      cannotBeWarlord: Boolean(row.cannotBeWarlord ?? miniature.cannotBeWarlord),
      canBeNonCharacterWarlord: Boolean(row.canBeNonCharacterWarlord ?? miniature.canBeNonCharacterWarlord),
      excludedFromEnhancements: Boolean(row.excludedFromEnhancements ?? miniature.excludedFromEnhancements),
      isSupremeCommander: Boolean(row.isSupremeCommander ?? miniature.isSupremeCommander),
      wargear: row.wargear || {},
    };
  });
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
  if (row.requiredRosterFactionKeywordId && row.requiredRosterFactionKeywordId !== roster.factionKeywordId) {
    return false;
  }
  if (row.requiredDetachmentId && !detachmentIds.has(row.requiredDetachmentId)) {
    return false;
  }
  return true;
}

function unitKeywords(roster, unit, miniatures, allegianceAbilities, warlordMiniatureIds) {
  const keywordIds = new Set();
  for (const miniature of miniatures) {
    if ((miniature.count || 0) <= 0) {
      continue;
    }
    for (const keywordId of miniatureKeywordIds(miniature.miniatureId)) {
      keywordIds.add(keywordId);
    }
  }
  if (!keywordIds.size && !miniatures.length) {
    for (const miniature of state.catalog.miniaturesByDatasheetId.get(unit.datasheetId) || []) {
      for (const keywordId of miniatureKeywordIds(miniature.id)) {
        keywordIds.add(keywordId);
      }
    }
  }
  const detachmentIds = new Set(roster.detachmentIds || []);
  const allegianceAbilityIds = new Set(allegianceAbilities.map((item) => item.id));
  for (const row of state.catalog.conditionalKeywordsByDatasheetId.get(unit.datasheetId) || []) {
    if (conditionalKeywordApplies(row, roster, detachmentIds, allegianceAbilityIds, warlordMiniatureIds)) {
      keywordIds.add(row.keywordId);
    }
  }
  return [...keywordIds]
    .map((id) => state.catalog.keywordById.get(id))
    .filter(Boolean)
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

function rosterWarlordMiniatureIds(roster) {
  const ids = [];
  for (const unit of roster.units || []) {
    const composition = state.catalog.compositionById.get(unit.compositionId)
      || defaultComposition(unit.datasheetId, compositionFactionIds(roster, unit.allyType || "native"), roster.detachmentIds || []);
    for (const miniature of miniaturesForUnit(unit, composition)) {
      if (miniature.isWarlord && miniature.count > 0) {
        ids.push(miniature.miniatureId);
      }
    }
  }
  return ids;
}

function datasheetPointsStepForUnit(roster, unit) {
  const step = state.catalog.datasheetPointsStepsByDatasheetId.get(unit.datasheetId)?.[0];
  if (!step) {
    return 0;
  }
  const sameDatasheetIds = (roster.units || [])
    .filter((candidate) => candidate.datasheetId === unit.datasheetId)
    .map((candidate) => candidate.id);
  const position = sameDatasheetIds.indexOf(unit.id) + 1;
  return position >= (step.stepAt || 0) ? (step.stepPoints || 0) : 0;
}

function enhancementPoints(enhancementId, keywordIds) {
  const keywordSet = new Set(keywordIds || []);
  const override = [...(state.catalog.enhancementKeywordPointsCostsByEnhancementId.get(enhancementId) || [])]
    .sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0))
    .find((row) => keywordSet.has(row.keywordId));
  const enhancement = state.catalog.enhancementById.get(enhancementId);
  return override?.pointsCost ?? enhancement?.basePointsCost ?? 0;
}

function unitSummary(roster, unit) {
  const datasheet = state.catalog.datasheetById.get(unit.datasheetId) || {};
  const allyType = unit.allyType || "native";
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = state.catalog.compositionById.get(unit.compositionId)
    || defaultComposition(unit.datasheetId, factionIds, roster.detachmentIds || []);
  const miniatures = miniaturesForUnit(unit, composition);
  const selectedAbilities = selectedAllegianceAbilities(unit);
  const ownWarlordMiniatureIds = miniatures.filter((item) => item.isWarlord && item.count > 0).map((item) => item.miniatureId);
  const rosterWarlordIds = new Set([...rosterWarlordMiniatureIds(roster), ...ownWarlordMiniatureIds]);
  const keywords = unitKeywords(roster, unit, miniatures, selectedAbilities, rosterWarlordIds);
  const keywordIds = keywords.map((item) => item.id);
  const unitEnhancements = selectedUnitEnhancements(unit).map((enhancement) => ({
    ...enhancement,
    points: enhancementPoints(enhancement.id, keywordIds),
  }));
  const miniatureEnhancements = selectedMiniatureEnhancements(unit).map((enhancement) => {
    const miniature = miniatures.find((item) => (
      item.rosterUnitMiniatureId === enhancement.targetId || item.id === enhancement.targetId
    ));
    const targetKeywordIds = miniature ? miniatureKeywordIds(miniature.miniatureId) : keywordIds;
    return {
      ...enhancement,
      points: enhancementPoints(enhancement.id, targetKeywordIds),
    };
  });
  const compositionAvailable = composition ? compositionIsAvailable(composition, factionIds, roster.detachmentIds || []) : false;
  const points = (composition?.points || 0)
    + datasheetPointsStepForUnit(roster, unit)
    + wargearPoints(unit)
    + unitEnhancements.reduce((total, enhancement) => total + (enhancement.points || 0), 0)
    + miniatureEnhancements.reduce((total, enhancement) => total + (enhancement.points || 0), 0);
  return {
    ...unit,
    allyType,
    name: datasheet.name || unit.name || "Unit",
    compositionId: composition?.id || unit.compositionId || "",
    points,
    datasheetPointsStep: datasheetPointsStepForUnit(roster, unit),
    modelCount: miniatures.reduce((total, miniature) => total + (miniature.count || 0), 0),
    maxModelCount: datasheet.maxModelCount,
    isSuccessorChapter: Boolean(datasheet.isSuccessorChapter),
    allegianceAbilityGroupId: datasheet.allegianceAbilityGroupId,
    selectedCompositionId: composition?.id || "",
    selectedCompositionAvailable: compositionAvailable,
    keywordIds,
    keywordNames: keywords.map((item) => item.name),
    factionKeywordIds: idsFromRows(state.catalog.datasheetFactionKeywordsByDatasheetId.get(unit.datasheetId), "factionKeywordId"),
    isWarlord: ownWarlordMiniatureIds.length > 0,
    warlordMiniatureIds: ownWarlordMiniatureIds,
    miniatures,
    allegianceAbilities: selectedAbilities,
    unitEnhancements,
    miniatureEnhancements,
  };
}

function rosterUnitSummaries(roster) {
  return (roster.units || []).map((unit) => unitSummary(roster, unit));
}

function availableDetachments(factionKeywordId) {
  const allowedIds = new Set(
    state.catalog.detachmentFactionKeywords
      .filter((row) => row.factionKeywordId === factionKeywordId)
      .map((row) => row.detachmentId)
  );
  return state.catalog.detachments
    .filter((detachment) => allowedIds.has(detachment.id) && !detachment.isCombatPatrol)
    .sort((left, right) => (
      (left.displayOrder || 0) - (right.displayOrder || 0)
      || String(left.name || "").localeCompare(String(right.name || ""))
    ));
}

function detachmentAllowed(detachmentId, factionKeywordId) {
  return state.catalog.detachmentFactionKeywords.some((row) => (
    row.detachmentId === detachmentId && row.factionKeywordId === factionKeywordId
  ));
}

function factionExcludesDatasheet(factionKeywordId, datasheetId) {
  const scope = new Set(factionScope(factionKeywordId));
  return state.catalog.factionExcludedDatasheets.some((row) => (
    row.datasheetId === datasheetId && scope.has(row.factionKeywordId)
  ));
}

function datasheetHasDescendantFaction(factionKeywordId, datasheetId) {
  const descendants = new Set(factionDescendantIds(factionKeywordId));
  if (!descendants.size) {
    return false;
  }
  return datasheetFactionIds(datasheetId).some((id) => descendants.has(id));
}

function datasheetIsNativeToFaction(factionKeywordId, datasheetId) {
  const datasheetFactions = datasheetFactionIds(datasheetId);
  const scope = new Set(factionScope(factionKeywordId));
  if (!datasheetFactions.some((id) => scope.has(id))) {
    return false;
  }
  if (factionExcludesDatasheet(factionKeywordId, datasheetId)) {
    return false;
  }
  if (datasheetFactions.includes(factionKeywordId) && datasheetHasDescendantFaction(factionKeywordId, datasheetId)) {
    return false;
  }
  return true;
}

function compositionIsAvailable(composition, factionKeywordIds, detachmentIds) {
  const requiredFactionIds = state.catalog.requiredFactionKeywordsByCompositionId
    .get(composition.id)
    ?.map((row) => row.factionKeywordId) || [];
  if (requiredFactionIds.length && !requiredFactionIds.some((id) => factionKeywordIds.includes(id))) {
    return false;
  }
  const requiredDetachmentIds = state.catalog.requiredDetachmentsByCompositionId
    .get(composition.id)
    ?.map((row) => row.detachmentId) || [];
  if (requiredDetachmentIds.length && !requiredDetachmentIds.some((id) => detachmentIds.includes(id))) {
    return false;
  }
  return true;
}

function defaultComposition(datasheetId, factionKeywordIds, detachmentIds) {
  const compositions = [...(state.catalog.compositionsByDatasheetId.get(datasheetId) || [])]
    .sort((left, right) => (
      Number(Boolean(right.isDefault)) - Number(Boolean(left.isDefault))
      || (left.displayOrder || 0) - (right.displayOrder || 0)
    ));
  return compositions.find((item) => compositionIsAvailable(item, factionKeywordIds, detachmentIds)) || null;
}

function compositionLabel(composition) {
  const rows = state.catalog.compositionMiniaturesByCompositionId.get(composition?.id) || [];
  if (!rows.length) {
    return "Composition";
  }
  return rows.map((row) => {
    const count = row.min === row.max ? row.min : `${row.min}-${row.max}`;
    const miniature = state.catalog.miniatureById.get(row.miniatureId);
    return `${count} ${miniature?.name || "model"}`;
  }).join(" + ");
}

function datasheetExcluded(roster, datasheetId) {
  if (factionExcludesDatasheet(roster.factionKeywordId, datasheetId)) {
    return true;
  }
  return datasheetDetachmentExcluded(roster, datasheetId);
}

function datasheetDetachmentExcluded(roster, datasheetId) {
  return (roster.detachmentIds || []).some((detachmentId) => (
    state.catalog.detachmentExcludedDatasheets.some((row) => (
      row.detachmentId === detachmentId && row.datasheetId === datasheetId
    ))
  ));
}

function datasheetIsCombatPatrol(datasheet) {
  return Boolean(state.catalog.publicationById.get(datasheet?.publicationId)?.isCombatPatrol);
}

function alliedFactionName(alliedFactionId) {
  const names = idsFromRows(
    state.catalog.alliedFactionParentsByAlliedFactionId.get(alliedFactionId),
    "factionKeywordId"
  ).map((id) => state.catalog.factionKeywordById.get(id)?.name).filter(Boolean);
  return names.length ? names.join(", ") : "Allied";
}

function availableUnitSources(roster) {
  const factionName = state.catalog.factionById.get(roster.factionKeywordId)?.name || "Roster Faction";
  const alliedSources = idsFromRows(
    state.catalog.factionAlliedFactionsByFactionId.get(roster.factionKeywordId),
    "alliedFactionId"
  )
    .filter((id, index, values) => values.indexOf(id) === index)
    .filter((id) => (state.catalog.alliedFactionDatasheetsByAlliedFactionId.get(id) || []).length)
    .map((id) => ({ value: id, label: `Allied: ${alliedFactionName(id)}` }))
    .sort((left, right) => left.label.localeCompare(right.label));
  return [
    { value: "native", label: factionName },
    ...alliedSources,
  ];
}

function alliedFactionAllowed(factionKeywordId, alliedFactionId) {
  return (state.catalog.factionAlliedFactionsByFactionId.get(factionKeywordId) || [])
    .some((row) => row.alliedFactionId === alliedFactionId);
}

function availableDatasheets(roster, allyType = "native") {
  const factionIds = compositionFactionIds(roster, allyType);
  const allowedAlliedDatasheets = allyType === "native"
    ? null
    : new Set(idsFromRows(state.catalog.alliedFactionDatasheetsByAlliedFactionId.get(allyType), "datasheetId"));
  return state.catalog.datasheets
    .filter((datasheet) => {
      if (allyType === "native") {
        return datasheetIsNativeToFaction(roster.factionKeywordId, datasheet.id) && !datasheetExcluded(roster, datasheet.id);
      }
      return alliedFactionAllowed(roster.factionKeywordId, allyType)
        && allowedAlliedDatasheets?.has(datasheet.id)
        && !datasheetDetachmentExcluded(roster, datasheet.id);
    })
    .filter((datasheet) => !datasheetIsCombatPatrol(datasheet))
    .filter((datasheet) => defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []))
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

function addWargearCount(result, optionId, count) {
  const value = Math.max(0, Number(count || 0));
  if (!value) {
    return;
  }
  result[optionId] = (result[optionId] || 0) + value;
}

function defaultWargear(datasheetId, compositionId = "") {
  const result = {};
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(datasheetId) || []) {
    if (group.miniatureId) {
      continue;
    }
    for (const item of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      addWargearCount(result, item.id, item.defaultValue);
    }
  }
  return result;
}

function optionItemCounts(optionCounts) {
  const result = {};
  for (const [optionId, count] of Object.entries(optionCounts || {})) {
    const optionRow = state.catalog.wargearOptionById.get(optionId);
    const item = optionRow ? state.catalog.wargearItemById.get(optionRow.wargearItemId) : null;
    if (item) {
      result[lowerName(item.name)] = (result[lowerName(item.name)] || 0) + Number(count || 0);
    }
  }
  return cleanCounts(result);
}

function defaultWargearOptionsByKey(datasheetId, miniatureId) {
  const rows = [];
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(datasheetId) || []) {
    if (group.miniatureId !== miniatureId) {
      continue;
    }
    for (const option of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      const item = state.catalog.wargearItemById.get(option.wargearItemId);
      if (item) {
        rows.push({ key: lowerName(item.name), option });
      }
    }
  }
  rows.sort((left, right) => (
    Number((right.option.defaultValue || 0) > 0) - Number((left.option.defaultValue || 0) > 0)
    || (left.option.displayOrder || 0) - (right.option.displayOrder || 0)
  ));
  const options = new Map();
  for (const row of rows) {
    if (!options.has(row.key)) {
      options.set(row.key, row.option.id);
    }
  }
  return options;
}

function defaultLoadoutScore(candidate, preferred) {
  const keys = new Set([...Object.keys(candidate || {}), ...Object.keys(preferred || {})]);
  let overlap = 0;
  let over = 0;
  let under = 0;
  let total = 0;
  for (const key of keys) {
    const candidateValue = candidate[key] || 0;
    const preferredValue = preferred[key] || 0;
    overlap += Math.min(candidateValue, preferredValue);
    over += Math.max(0, candidateValue - preferredValue);
    under += Math.max(0, preferredValue - candidateValue);
    total += candidateValue;
  }
  return [overlap, -over, -under, -total];
}

function compareScores(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

function closestValidDefaultLoadout(datasheetId, miniatureId, preferredOptions, modelCount, optionByKey) {
  const preferred = optionItemCounts(preferredOptions);
  const sets = loadoutChoiceSets(datasheetId, miniatureId);
  if (!sets.length) {
    return Object.keys(preferred).length ? null : {};
  }
  const valid = validLoadoutsFromChoiceSets(sets)
    .filter((loadout) => Object.keys(loadout).every((key) => optionByKey.has(key)));
  if (!valid.length) {
    return null;
  }
  let candidates = valid;
  if (modelCount > 1) {
    candidates = [{}];
    for (let index = 0; index < modelCount; index += 1) {
      const seen = new Set();
      const next = [];
      for (const base of candidates) {
        for (const loadout of valid) {
          const candidate = addCounts(base, loadout);
          const key = countKey(candidate);
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          next.push(candidate);
        }
      }
      candidates = next
        .sort((left, right) => compareScores(defaultLoadoutScore(right, preferred), defaultLoadoutScore(left, preferred)))
        .slice(0, 2000);
    }
  }
  let best = candidates[0];
  let bestScore = defaultLoadoutScore(best, preferred);
  for (const candidate of candidates.slice(1)) {
    const score = defaultLoadoutScore(candidate, preferred);
    if (compareScores(score, bestScore) > 0) {
      best = candidate;
      bestScore = score;
    }
  }
  const result = {};
  for (const [key, count] of Object.entries(best || {})) {
    const optionId = optionByKey.get(key);
    if (!optionId) {
      return null;
    }
    addWargearCount(result, optionId, count);
  }
  return result;
}

function defaultMiniatureWargear(datasheetId, miniatureId, modelCount) {
  const result = {};
  const loadout = baseMiniatureLoadout(datasheetId, miniatureId);
  if (loadout) {
    for (const item of state.catalog.baseMiniatureLoadoutWargearOptionsByLoadoutId.get(loadout.id) || []) {
      const optionRow = state.catalog.wargearOptionById.get(item.wargearOptionId);
      const group = optionRow ? state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId) : null;
      if (group?.datasheetId === datasheetId && group?.miniatureId === miniatureId) {
        addWargearCount(result, item.wargearOptionId, (item.count || 0) * (modelCount || 0));
      }
    }
  }
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(datasheetId) || []) {
    if (group.miniatureId !== miniatureId) {
      continue;
    }
    for (const item of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      if (!(item.id in result)) {
        addWargearCount(result, item.id, item.defaultValue);
      }
    }
  }
  const optionByKey = defaultWargearOptionsByKey(datasheetId, miniatureId);
  return closestValidDefaultLoadout(datasheetId, miniatureId, result, modelCount || 0, optionByKey) || result;
}

function defaultMiniatures(datasheetId, compositionId = "") {
  const composition = state.catalog.compositionById.get(compositionId);
  return compositionMiniatures(composition).map((model) => ({
    miniatureId: model.miniatureId,
    count: Math.max(0, Number(model.min || 0)),
    wargear: defaultMiniatureWargear(datasheetId, model.miniatureId, Math.max(0, Number(model.min || 0))),
  }));
}

function baseMiniatureLoadout(datasheetId, miniatureId) {
  const exact = (state.catalog.baseMiniatureLoadoutsByMiniatureId.get(miniatureId) || [])
    .find((row) => row.datasheetId === datasheetId);
  if (exact) {
    return exact;
  }
  return (state.catalog.baseMiniatureLoadoutsByDatasheetId.get(datasheetId) || [])
    .find((row) => !row.miniatureId) || null;
}

function selectedWargearEntries(unit) {
  const entries = [];
  for (const [optionId, count] of Object.entries(unit.wargear || {})) {
    if ((count || 0) > 0) {
      entries.push({
        optionId,
        count: Number(count || 0),
        rosterUnitMiniatureId: null,
        miniatureId: null,
      });
    }
  }
  for (const [optionId, count] of Object.entries(unit.unitWargear || {})) {
    if ((count || 0) > 0) {
      entries.push({ optionId, count: Number(count || 0), rosterUnitMiniatureId: null, miniatureId: null });
    }
  }
  for (const miniature of unit.miniatures || []) {
    for (const [optionId, count] of Object.entries(miniature.wargear || {})) {
      if ((count || 0) > 0) {
        entries.push({
          optionId,
          count: Number(count || 0),
          rosterUnitMiniatureId: miniature.rosterUnitMiniatureId || miniature.id,
          miniatureId: miniature.miniatureId,
        });
      }
    }
  }
  return entries;
}

function wargearPoints(unit) {
  return selectedWargearEntries(unit).reduce((total, entry) => {
    const optionRow = state.catalog.wargearOptionById.get(entry.optionId);
    return total + (optionRow?.points || 0) * (entry.count || 0);
  }, 0);
}

function rosterPoints(roster) {
  return rosterUnitSummaries(roster).reduce((total, unit) => total + (unit.points || 0), 0);
}

export {
  alliedFactionName,
  availableDatasheets,
  availableDetachments,
  availableUnitSources,
  compositionFactionIds,
  compositionLabel,
  conditionalKeywordApplies,
  costForDetachment,
  datasheetFactionIds,
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  defaultComposition,
  defaultMiniatures,
  defaultWargear,
  detachmentAllowed,
  detachmentBadgeNode,
  detachmentDispositionBadgeNode,
  detachmentDispositionName,
  enhancementPoints,
  factionExcludesDatasheet,
  factionScope,
  idsFromRows,
  lowerName,
  miniatureKeywordIds,
  namesForIds,
  rosterPoints,
  rosterUnitSummaries,
  selectedWargearEntries,
  setIntersects,
  unitSummary,
  unique,
  wargearPoints,
};
