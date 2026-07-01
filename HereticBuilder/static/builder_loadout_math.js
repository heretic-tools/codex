import { state } from "./builder_state.js";

function contextKey(datasheetId, miniatureId = null) {
  return `${datasheetId || ""}:${miniatureId || ""}`;
}

function canonicalWargearKey(wargearItemId, context = {}) {
  if (!wargearItemId) {
    return "";
  }
  const aliases = state.catalog.wargearAliasesByContext || new Map();
  const exact = aliases.get(contextKey(context.datasheetId, context.miniatureId))?.get(wargearItemId);
  if (exact) {
    return exact;
  }
  const datasheetWide = aliases.get(contextKey(context.datasheetId, null))?.get(wargearItemId);
  if (datasheetWide) {
    return datasheetWide;
  }
  return `id:${wargearItemId}`;
}

function wargearOptionKey(optionRow) {
  const group = optionRow ? state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId) : null;
  return canonicalWargearKey(optionRow?.wargearItemId, {
    datasheetId: group?.datasheetId,
    miniatureId: group?.miniatureId,
  });
}

function countKey(counts) {
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

function cleanCounts(counts) {
  const result = {};
  for (const [key, value] of Object.entries(counts || {})) {
    const count = Number(value || 0);
    if (count > 0) {
      result[key] = count;
    }
  }
  return result;
}

function addCounts(...items) {
  const result = {};
  for (const counts of items) {
    for (const [key, value] of Object.entries(counts || {})) {
      result[key] = (result[key] || 0) + Number(value || 0);
    }
  }
  return cleanCounts(result);
}

function countsEqual(left, right) {
  return countKey(left) === countKey(right);
}

function dedupeCounts(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const clean = cleanCounts(item);
    const key = countKey(clean);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(clean);
  }
  return result;
}

function combinations(items, limit, start = 0) {
  if (limit === 0) {
    return [[]];
  }
  const result = [];
  for (let index = start; index <= items.length - limit; index += 1) {
    for (const tail of combinations(items, limit - 1, index + 1)) {
      result.push([items[index], ...tail]);
    }
  }
  return result;
}

function combinationsWithReplacement(items, limit, start = 0) {
  if (limit === 0) {
    return [[]];
  }
  const result = [];
  for (let index = start; index < items.length; index += 1) {
    for (const tail of combinationsWithReplacement(items, limit - 1, index)) {
      result.push([items[index], ...tail]);
    }
  }
  return result;
}

function choiceItems(rows, context = {}) {
  const counts = {};
  for (const row of rows || []) {
    const item = state.catalog.wargearItemById.get(row.wargearItemId);
    if (item) {
      const key = canonicalWargearKey(row.wargearItemId, context);
      counts[key] = (counts[key] || 0) + (row.count || 0);
    }
  }
  return cleanCounts(counts);
}

function loadoutChoiceItems(choiceId, context) {
  return choiceItems(state.catalog.loadoutChoiceItemsByChoiceId.get(choiceId), context);
}

function loadoutChoiceSets(datasheetId, miniatureId) {
  return (state.catalog.loadoutChoiceSetsByDatasheetId.get(datasheetId) || [])
    .filter((row) => (miniatureId ? row.miniatureId === miniatureId : !row.miniatureId))
    .sort((left, right) => (
      Number(Boolean(left.alternate)) - Number(Boolean(right.alternate))
      || String(left.id).localeCompare(String(right.id))
    ))
    .map((row) => ({
      ...row,
      choices: (state.catalog.loadoutChoicesBySetId.get(row.id) || []).map((choice) => loadoutChoiceItems(choice.id, {
        datasheetId: row.datasheetId,
        miniatureId: row.miniatureId,
      })),
    }));
}

function choiceSetLoadouts(choiceSet) {
  const choices = choiceSet.choices || [];
  const limit = choiceSet.limit || 0;
  if (limit === 0) {
    return [{}];
  }
  if (!choices.length) {
    return [];
  }
  if (choiceSet.allowDuplicates) {
    return dedupeCounts(combinationsWithReplacement(choices, limit).map((items) => addCounts(...items)));
  }
  const emptyChoices = choices.filter((choice) => !Object.keys(choice).length);
  if (emptyChoices.length) {
    const nonEmptyChoices = choices.filter((choice) => Object.keys(choice).length);
    const raw = [];
    for (let selectedCount = 0; selectedCount <= Math.min(limit, nonEmptyChoices.length); selectedCount += 1) {
      raw.push(...combinations(nonEmptyChoices, selectedCount));
    }
    return dedupeCounts(raw.map((items) => addCounts(...items)));
  }
  if (limit > choices.length) {
    return [];
  }
  return dedupeCounts(combinations(choices, limit).map((items) => addCounts(...items)));
}

function validLoadoutsFromChoiceSets(sets) {
  const regularSets = sets.filter((item) => !item.alternate);
  const alternateSets = sets.filter((item) => item.alternate);
  const loadouts = [];
  if (regularSets.length) {
    let products = [{}];
    for (const set of regularSets) {
      const setLoadouts = choiceSetLoadouts(set);
      if (!setLoadouts.length) {
        products = [];
        break;
      }
      const next = [];
      for (const base of products) {
        for (const piece of setLoadouts) {
          next.push(addCounts(base, piece));
        }
      }
      products = next;
    }
    loadouts.push(...products);
  } else {
    loadouts.push({});
  }
  for (const set of alternateSets) {
    loadouts.push(...choiceSetLoadouts(set));
  }
  return dedupeCounts(loadouts);
}

function canPartitionLoadouts(selectedCounts, validLoadouts, modelCount) {
  const selected = cleanCounts(selectedCounts);
  const keys = Object.keys(selected).sort();
  const target = keys.map((key) => selected[key]);
  const vectors = [];
  for (const loadout of validLoadouts) {
    if (Object.keys(loadout).some((key) => !(key in selected))) {
      continue;
    }
    const vector = keys.map((key) => loadout[key] || 0);
    if (vector.every((value, index) => value <= target[index])) {
      vectors.push(vector);
    }
  }
  const uniqueVectors = [...new Map(vectors.map((vector) => [vector.join(","), vector])).values()]
    .sort((left, right) => right.reduce((a, b) => a + b, 0) - left.reduce((a, b) => a + b, 0));
  if (!uniqueVectors.length) {
    return !keys.length && modelCount === 0;
  }
  const memo = new Map();
  const fits = (vector, remaining) => vector.every((value, index) => value <= remaining[index]);
  const subtract = (vector, remaining) => remaining.map((value, index) => value - vector[index]);
  const search = (remaining, modelsLeft) => {
    const key = `${remaining.join(",")}:${modelsLeft}`;
    if (memo.has(key)) {
      return memo.get(key);
    }
    if (modelsLeft === 0) {
      const done = remaining.every((value) => value === 0);
      memo.set(key, done);
      return done;
    }
    for (const vector of uniqueVectors) {
      if (fits(vector, remaining) && search(subtract(vector, remaining), modelsLeft - 1)) {
        memo.set(key, true);
        return true;
      }
    }
    memo.set(key, false);
    return false;
  };
  return search(target, modelCount);
}

function wargearLoadoutMatchesChoiceSets(datasheetId, miniatureId, selectedCounts, modelCount) {
  const selected = cleanCounts(selectedCounts);
  const sets = loadoutChoiceSets(datasheetId, miniatureId);
  if (!sets.length) {
    return !Object.keys(selected).length;
  }
  const validLoadouts = validLoadoutsFromChoiceSets(sets);
  if (modelCount <= 1) {
    return validLoadouts.some((loadout) => countsEqual(loadout, selected));
  }
  return canPartitionLoadouts(selected, validLoadouts, modelCount);
}

export {
  addCounts,
  canonicalWargearKey,
  choiceItems,
  cleanCounts,
  countKey,
  loadoutChoiceSets,
  validLoadoutsFromChoiceSets,
  wargearOptionKey,
  wargearLoadoutMatchesChoiceSets,
};
