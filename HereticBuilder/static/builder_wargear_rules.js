import { state } from "./builder_state.js";
import {
  canonicalWargearKey,
  choiceItems,
  cleanCounts,
  countKey,
  wargearLoadoutMatchesChoiceSets,
} from "./builder_loadout_math.js";
import { selectedWargearEntries } from "./builder_model.js";
import { unitValidationMessage } from "./builder_validation_messages.js";

function limitedChoiceItems(choiceId, context) {
  return choiceItems(state.catalog.limitedWargearChoiceItemsByChoiceId.get(choiceId), context);
}

function allModelChoiceItems(choiceId, context) {
  return choiceItems(state.catalog.allModelWargearChoiceItemsByChoiceId.get(choiceId), context);
}

function entryTargetsUnit(entry) {
  return !entry.rosterUnitMiniatureId && !entry.miniatureId;
}

function entryMatchesMiniature(entry, miniature) {
  if (!miniature) {
    return false;
  }
  const targetRosterMiniatureId = miniature.rosterUnitMiniatureId || miniature.id || "";
  if (targetRosterMiniatureId && entry.rosterUnitMiniatureId === targetRosterMiniatureId) {
    return true;
  }
  return Boolean(entry.miniatureId && miniature.miniatureId && entry.miniatureId === miniature.miniatureId);
}

function entryTargetMiniature(unit, entry) {
  return (unit.miniatures || []).find((miniature) => entryMatchesMiniature(entry, miniature)) || null;
}

function filterCountsByKeys(counts, keys) {
  return cleanCounts(Object.fromEntries(
    Object.entries(counts || {}).filter(([key]) => keys.has(key))
  ));
}

function selectedWargearCounts(unit, predicate, includeOption = () => true) {
  const counts = {};
  for (const entry of selectedWargearEntries(unit)) {
    if (!predicate(entry)) {
      continue;
    }
    const optionRow = state.catalog.wargearOptionById.get(entry.optionId);
    if (!optionRow) {
      continue;
    }
    if (!includeOption(optionRow, entry)) {
      continue;
    }
    const item = state.catalog.wargearItemById.get(optionRow.wargearItemId);
    if (item) {
      const group = state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId);
      const key = canonicalWargearKey(optionRow.wargearItemId, {
        datasheetId: group?.datasheetId || unit.datasheetId,
        miniatureId: group?.miniatureId || entry.miniatureId,
      });
      counts[key] = (counts[key] || 0) + (entry.count || 0);
    }
  }
  return cleanCounts(counts);
}

function selectedUnitWargearCounts(unit) {
  return selectedWargearCounts(unit, (entry) => entryTargetsUnit(entry));
}

function selectedMiniatureWargearCounts(unit, miniatureOrId) {
  const miniature = typeof miniatureOrId === "object" ? miniatureOrId : { miniatureId: miniatureOrId };
  return selectedWargearCounts(unit, (entry) => !entryTargetsUnit(entry) && entryMatchesMiniature(entry, miniature));
}

function selectedRosterUnitWargearCounts(unit) {
  return selectedWargearCounts(unit, () => true);
}

function scopeModelCount(unit, miniatureId) {
  if (!miniatureId) {
    return unit.modelCount || 0;
  }
  return unit.miniatures.find((miniature) => miniature.miniatureId === miniatureId)?.count || 0;
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
      messages.push(unitValidationMessage("wargear_loadout.invalid_wargear_requirement", unit, `Invalid wargear configuration for ${unit.name}.`));
    }
  }
}

function choiceOccurrences(selectedCounts, choice) {
  const entries = Object.entries(choice || {});
  if (!entries.length) {
    return 0;
  }
  return Math.min(...entries.map(([key, count]) => Math.floor((selectedCounts[key] || 0) / count)));
}

function allModelWargearChoices(allModelSet) {
  return (state.catalog.allModelWargearChoicesBySetId.get(allModelSet.id) || []).map((row) => ({
    substitute: Boolean(row.substitute),
    items: allModelChoiceItems(row.id, {
      datasheetId: allModelSet.datasheetId,
      miniatureId: allModelSet.miniatureId,
    }),
  }));
}

function substituteFamilyKey(allModelSet, substituteChoices) {
  const signature = substituteChoices
    .map((choice) => countKey(choice.items))
    .filter(Boolean)
    .sort()
    .join("||");
  return `${allModelSet.datasheetId || ""}:${allModelSet.miniatureId || ""}:${signature}`;
}

function validateAllModelWargearChoiceSets(unit, messages) {
  const checksByFamily = new Map();
  for (const row of state.catalog.allModelWargearChoiceSetsByDatasheetId.get(unit.datasheetId) || []) {
    const choices = allModelWargearChoices(row);
    const baseChoices = choices.filter((choice) => !choice.substitute);
    const substituteChoices = choices.filter((choice) => choice.substitute);
    const selected = row.miniatureId
      ? selectedMiniatureWargearCounts(unit, row.miniatureId)
      : selectedRosterUnitWargearCounts(unit);
    const modelCount = scopeModelCount(unit, row.miniatureId);
    if (modelCount <= 0) {
      continue;
    }
    const familyKey = substituteFamilyKey(row, substituteChoices);
    if (!checksByFamily.has(familyKey)) {
      checksByFamily.set(familyKey, {
        hasValidBaseLine: false,
        hasHardInvalid: false,
        hasSubstituteWithoutBase: false,
      });
    }
    const family = checksByFamily.get(familyKey);
    const activeBase = [];
    for (const choice of baseChoices) {
      const occurrences = choiceOccurrences(selected, choice.items);
      if (occurrences) {
        activeBase.push([choice, occurrences]);
      }
    }
    const substituteCount = choices
      .filter((choice) => choice.substitute)
      .reduce((total, choice) => total + choiceOccurrences(selected, choice.items), 0);
    if (activeBase.length > 1) {
      family.hasHardInvalid = true;
      continue;
    }
    if (baseChoices.length && !activeBase.length && substituteCount) {
      family.hasSubstituteWithoutBase = true;
      continue;
    }
    if (activeBase.length === 1 && activeBase[0][1] + substituteCount !== modelCount) {
      family.hasHardInvalid = true;
    } else if (activeBase.length === 1) {
      family.hasValidBaseLine = true;
    }
  }
  const invalid = [...checksByFamily.values()].some((family) => (
    family.hasHardInvalid || (family.hasSubstituteWithoutBase && !family.hasValidBaseLine)
  ));
  if (invalid) {
    messages.push(unitValidationMessage("wargear_loadout.invalid_wargear_requirement", unit, `Invalid wargear configuration for ${unit.name}.`));
  }
}

function validateWargearEntryScope(unit, entry, messages) {
  const optionRow = state.catalog.wargearOptionById.get(entry.optionId);
  const item = optionRow ? state.catalog.wargearItemById.get(optionRow.wargearItemId) : null;
  const group = optionRow ? state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId) : null;
  const target = entryTargetMiniature(unit, entry);
  if (!optionRow || !group || group.datasheetId !== unit.datasheetId) {
    if (entryTargetsUnit(entry)) {
      messages.push(unitValidationMessage("wargear_loadout.invalid_unit_wargear", unit, `${unit.name} has invalid unit wargear selected: ${item?.name || "unknown wargear"}.`));
    } else {
      messages.push(unitValidationMessage("wargear_loadout.invalid_model_wargear", unit, `${unit.name} has invalid wargear for ${target?.name || "model"}: ${item?.name || "unknown wargear"}.`, {
        targetId: target?.rosterUnitMiniatureId || target?.id || target?.miniatureId || entry.miniatureId,
      }));
    }
    return;
  }
  if (entryTargetsUnit(entry)) {
    if (group.miniatureId) {
      messages.push(unitValidationMessage("wargear_loadout.invalid_unit_wargear", unit, `${unit.name} has invalid unit wargear selected: ${item?.name || "unknown wargear"}.`));
    }
    return;
  }
  const selectedMiniatureId = target?.miniatureId || entry.miniatureId || "";
  if (!group.miniatureId || group.miniatureId !== selectedMiniatureId) {
    messages.push(unitValidationMessage("wargear_loadout.invalid_model_wargear", unit, `${unit.name} has invalid wargear for ${target?.name || "model"}: ${item?.name || "unknown wargear"}.`, {
      targetId: target?.rosterUnitMiniatureId || target?.id || target?.miniatureId || entry.miniatureId,
    }));
  }
}

function validateWargearLoadouts(units, messages) {
  for (const unit of units) {
    for (const entry of selectedWargearEntries(unit)) {
      validateWargearEntryScope(unit, entry, messages);
    }
    if (!wargearLoadoutMatchesChoiceSets(unit.datasheetId, null, selectedUnitWargearCounts(unit), 1)) {
      messages.push(unitValidationMessage("wargear_loadout.invalid_unit_wargear_loadout", unit, `${unit.name} has an invalid unit wargear configuration.`));
    }
    for (const miniature of unit.miniatures || []) {
      const selected = selectedMiniatureWargearCounts(unit, miniature);
      if (miniature.count === 0) {
        if (Object.keys(selected).length) {
          messages.push(unitValidationMessage("wargear_loadout.zero_count_model_wargear", unit, `${unit.name} has wargear selected for a model count of 0: ${miniature.name}.`, {
            targetId: miniature.rosterUnitMiniatureId || miniature.id || miniature.miniatureId,
          }));
        }
        continue;
      }
      if (!wargearLoadoutMatchesChoiceSets(unit.datasheetId, miniature.miniatureId, selected, miniature.count)) {
        messages.push(unitValidationMessage(
          "wargear_loadout.invalid_miniature_wargear_loadout",
          unit,
          unit.modelCount === 1
            ? `Invalid wargear selected for ${unit.name}.`
            : `Invalid wargear selected for ${miniature.name} model in ${unit.name}.`,
          {
            targetId: miniature.rosterUnitMiniatureId || miniature.id || miniature.miniatureId,
          }
        ));
      }
    }
    validateLimitedWargearChoiceSets(unit, messages);
    validateAllModelWargearChoiceSets(unit, messages);
  }
}

export { validateWargearLoadouts };
