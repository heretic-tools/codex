import { state } from "./builder_state.js";
import {
  addCounts,
  cleanCounts,
  countKey,
  loadoutChoiceSets,
  validLoadoutsFromChoiceSets,
  wargearOptionKey,
} from "./builder_loadout_math.js";

function addWargearCount(result, optionId, count) {
  const value = Math.max(0, Number(count || 0));
  if (!value) {
    return;
  }
  result[optionId] = (result[optionId] || 0) + value;
}

function optionItemCounts(optionCounts) {
  const result = {};
  for (const [optionId, count] of Object.entries(optionCounts || {})) {
    const optionRow = state.catalog.wargearOptionById.get(optionId);
    const key = wargearOptionKey(optionRow);
    if (key) {
      result[key] = (result[key] || 0) + Number(count || 0);
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
      const key = wargearOptionKey(option);
      if (key) {
        rows.push({ key, option });
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

function baseMiniatureLoadout(datasheetId, miniatureId) {
  const exact = (state.catalog.baseMiniatureLoadoutsByMiniatureId.get(miniatureId) || [])
    .find((row) => row.datasheetId === datasheetId);
  if (exact) {
    return exact;
  }
  return (state.catalog.baseMiniatureLoadoutsByDatasheetId.get(datasheetId) || [])
    .find((row) => !row.miniatureId) || null;
}

function defaultMiniatureWargear(datasheetId, miniatureId, modelCount) {
  if ((modelCount || 0) <= 0) {
    return {};
  }
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

export { defaultMiniatureWargear };
