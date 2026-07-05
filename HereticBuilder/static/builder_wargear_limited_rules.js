import { canonicalWargearKey, choiceItems, cleanCounts } from "./builder_loadout_math.js";
import { state } from "./builder_state.js";
import { unitValidationMessage } from "./builder_validation_messages.js";
import { entryTargetsUnit, selectedWargearCounts, targetIdForMiniature } from "./builder_wargear_selection.js";

function limitedChoiceItems(choiceId, context) {
  return choiceItems(state.catalog.limitedWargearChoiceItemsByChoiceId.get(choiceId), context);
}

function filterCountsByKeys(counts, keys) {
  return cleanCounts(Object.fromEntries(
    Object.entries(counts || {}).filter(([key]) => keys.has(key))
  ));
}

function effectiveWargearLimit(limitedSetId, modelCount) {
  const rows = [...(state.catalog.wargearLimitsByLimitedSetId.get(limitedSetId) || [])]
    .sort((left, right) => (left.modelCount || 0) - (right.modelCount || 0));
  if (!rows.length) {
    return null;
  }
  const eligible = rows.filter((row) => (row.modelCount || 0) <= modelCount);
  return eligible.length ? eligible[eligible.length - 1] : { ...rows[0], choiceLimit: 0, duplicateLimit: 0 };
}

function limitedUpgradeKeys(limitedSet) {
  const keys = new Set();
  for (const group of state.catalog.wargearGroupsByDatasheetId.get(limitedSet.datasheetId) || []) {
    if (limitedSet.miniatureId && group.miniatureId !== limitedSet.miniatureId) {
      continue;
    }
    for (const option of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
      if (Number(option.defaultValue || 0) > 0) {
        continue;
      }
      keys.add(canonicalWargearKey(option.wargearItemId, {
        datasheetId: group.datasheetId,
        miniatureId: group.miniatureId,
      }));
    }
  }
  return keys;
}

function limitedWargearChoices(limitedSet, upgradeKeys) {
  const defaultAllowedKeys = new Set();
  const choices = [];
  for (const row of state.catalog.limitedWargearChoicesBySetId.get(limitedSet.id) || []) {
    const raw = limitedChoiceItems(row.id, {
      datasheetId: limitedSet.datasheetId,
      miniatureId: limitedSet.miniatureId,
    });
    const upgradeOnly = filterCountsByKeys(raw, upgradeKeys);
    const choice = Object.keys(upgradeOnly).length ? upgradeOnly : raw;
    if (!Object.keys(upgradeOnly).length) {
      for (const key of Object.keys(raw)) {
        defaultAllowedKeys.add(key);
      }
    }
    if (Object.keys(choice).length) {
      choices.push(choice);
    }
  }
  return { choices, defaultAllowedKeys };
}

function limitedChoiceCoverIsValid(selectedCounts, choices, choiceLimit, duplicateLimit, mandatory = false) {
  const relevantKeys = new Set(choices.flatMap((choice) => Object.keys(choice || {})));
  const targetCounts = filterCountsByKeys(selectedCounts, relevantKeys);
  const keys = Object.keys(targetCounts).sort();
  if (!keys.length) {
    return !mandatory;
  }
  if (choiceLimit <= 0) {
    return false;
  }
  const target = keys.map((key) => targetCounts[key]);
  const seen = new Set();
  const vectors = choices
    .filter((choice) => Object.keys(choice || {}).every((key) => key in targetCounts))
    .map((choice) => keys.map((key) => choice?.[key] || 0))
    .filter((vector) => vector.some(Boolean))
    .sort((left, right) => right.reduce((sum, value) => sum + value, 0) - left.reduce((sum, value) => sum + value, 0))
    .filter((vector) => {
      const key = vector.join(",");
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  if (!vectors.length) {
    return false;
  }
  const maxRepeats = duplicateLimit == null ? choiceLimit : Math.min(choiceLimit, duplicateLimit);
  const memo = new Map();
  const done = (remaining) => remaining.every((value) => value === 0);
  const subtract = (remaining, vector, repeats) => remaining.map((value, index) => value - vector[index] * repeats);
  const search = (choiceIndex, remaining, used) => {
    if (done(remaining)) {
      return true;
    }
    if (choiceIndex >= vectors.length || used >= choiceLimit) {
      return false;
    }
    const key = `${choiceIndex}:${used}:${remaining.join(",")}`;
    if (memo.has(key)) {
      return memo.get(key);
    }
    if (search(choiceIndex + 1, remaining, used)) {
      memo.set(key, true);
      return true;
    }
    const vector = vectors[choiceIndex];
    for (let repeats = 1; repeats <= Math.min(maxRepeats, choiceLimit - used); repeats += 1) {
      const candidate = subtract(remaining, vector, repeats);
      if (candidate.some((value) => value < 0)) {
        break;
      }
      if (search(choiceIndex + 1, candidate, used + repeats)) {
        memo.set(key, true);
        return true;
      }
    }
    memo.set(key, false);
    return false;
  };
  return search(0, target, 0);
}

function validateLimitedWargearChoiceSets(unit, messages) {
  for (const row of state.catalog.limitedWargearChoiceSetsByDatasheetId.get(unit.datasheetId) || []) {
    const limit = effectiveWargearLimit(row.id, unit.modelCount || 0);
    if (!limit) {
      continue;
    }
    const upgradeKeys = limitedUpgradeKeys(row);
    const { choices, defaultAllowedKeys } = limitedWargearChoices(row, upgradeKeys);
    const includeLimitedOption = (optionRow) => {
      const group = state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId);
      const key = canonicalWargearKey(optionRow.wargearItemId, {
        datasheetId: group?.datasheetId || row.datasheetId,
        miniatureId: group?.miniatureId,
      });
      return defaultAllowedKeys.has(key) || (Number(optionRow.defaultValue || 0) <= 0 && upgradeKeys.has(key));
    };
    const selected = row.miniatureId
      ? selectedWargearCounts(unit, (entry) => !entryTargetsUnit(entry) && entry.miniatureId === row.miniatureId, includeLimitedOption)
      : selectedWargearCounts(unit, () => true, includeLimitedOption);
    if (!limitedChoiceCoverIsValid(selected, choices, limit.choiceLimit, limit.duplicateLimit, row.mandatory && limit.choiceLimit > 0)) {
      messages.push(unitValidationMessage("wargear_loadout.invalid_wargear_requirement", unit, `Invalid wargear configuration for ${unit.name}.`, {
        targetId: targetIdForMiniature(unit, row.miniatureId),
      }));
    }
  }
}

export { validateLimitedWargearChoiceSets };
