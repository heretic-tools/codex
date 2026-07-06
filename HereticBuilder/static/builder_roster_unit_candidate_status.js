import {
  compositionFactionIds,
  defaultComposition,
  rosterUnitSummaries,
} from "./builder_model.js";
import { compositionMiniatures } from "./builder_model_miniatures.js";
import { unitKeywords } from "./builder_model_keywords.js";
import { state } from "./builder_state.js";
import { duplicateLimitForUnit } from "./builder_validation_core.js";

function candidateMiniatures(composition) {
  return compositionMiniatures(composition).map((row) => ({
    count: Math.max(0, Number(row.min || 0)),
    miniatureId: row.miniatureId,
    wargear: {},
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

function defaultWargearOptionPoints(optionIds, countMultiplier = 1) {
  let total = 0;
  for (const [optionId, count] of optionIds) {
    const optionRow = state.catalog.wargearOptionById.get(optionId);
    total += (optionRow?.points || 0) * (count || 0) * countMultiplier;
  }
  return total;
}

function defaultUnitWargearPoints(datasheetId) {
  const optionCounts = [];
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(datasheetId) || []) {
    if (group.miniatureId) {
      continue;
    }
    for (const optionRow of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      if ((optionRow.defaultValue || 0) > 0) {
        optionCounts.push([optionRow.id, optionRow.defaultValue]);
      }
    }
  }
  return defaultWargearOptionPoints(optionCounts);
}

function defaultMiniatureWargearPoints(datasheetId, miniatureId, modelCount) {
  if ((modelCount || 0) <= 0) {
    return 0;
  }
  const optionCounts = new Map();
  const loadout = baseMiniatureLoadout(datasheetId, miniatureId);
  for (const row of state.catalog.baseMiniatureLoadoutWargearOptionsByLoadoutId.get(loadout?.id) || []) {
    optionCounts.set(row.wargearOptionId, (optionCounts.get(row.wargearOptionId) || 0) + (row.count || 0));
  }
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(datasheetId) || []) {
    if (group.miniatureId !== miniatureId) {
      continue;
    }
    for (const optionRow of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      if ((optionRow.defaultValue || 0) > 0 && !optionCounts.has(optionRow.id)) {
        optionCounts.set(optionRow.id, optionRow.defaultValue);
      }
    }
  }
  return defaultWargearOptionPoints(optionCounts, modelCount);
}

function candidatePoints(datasheetId, composition, miniatures) {
  return (composition.points || 0)
    + defaultUnitWargearPoints(datasheetId)
    + miniatures.reduce((total, miniature) => (
      total + defaultMiniatureWargearPoints(datasheetId, miniature.miniatureId, miniature.count)
    ), 0);
}

function candidateSummary(roster, allyType, datasheet) {
  const unitId = `candidate:${allyType}:${datasheet.id}`;
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []);
  if (!composition) {
    return null;
  }
  const miniatures = candidateMiniatures(composition);
  const unit = {
    allyType,
    datasheetId: datasheet.id,
    id: unitId,
    compositionId: composition.id,
    miniatureEnhancements: [],
    miniatures,
    unitEnhancements: [],
    wargear: {},
  };
  const keywords = unitKeywords(roster, unit, miniatures, [], new Set());
  return {
    ...unit,
    keywordIds: keywords.map((keyword) => keyword.id),
    keywordNames: keywords.map((keyword) => keyword.name),
    modelCount: miniatures.reduce((total, miniature) => total + (miniature.count || 0), 0),
    name: datasheet.name || "Unit",
    points: candidatePoints(datasheet.id, composition, miniatures),
  };
}

function unitCandidateStatus(roster, validation, candidate, currentUnits = rosterUnitSummaries(roster)) {
  if (!candidate) {
    return { severity: "error", reason: "no composition" };
  }
  const battleSize = state.catalog.battleSizeById.get(roster.battleSizeId);
  const duplicateLimit = duplicateLimitForUnit(candidate, battleSize?.duplicateUnitLimit || 3);
  const currentCount = currentUnits.filter((unit) => unit.datasheetId === candidate.datasheetId).length;
  if (currentCount >= duplicateLimit) {
    return { severity: "error", reason: `limit ${duplicateLimit} reached` };
  }
  const pointsLimit = validation.points?.limit || 0;
  const nextPoints = (validation.points?.total || 0) + (candidate.points || 0);
  if (pointsLimit && nextPoints > pointsLimit) {
    return { severity: "warning", reason: `${nextPoints - pointsLimit} pts over` };
  }
  return { severity: "ok", reason: "" };
}

export {
  candidateSummary,
  unitCandidateStatus,
};
