import { state } from "./builder_state.js";
import { choiceItems, cleanCounts, wargearLoadoutMatchesChoiceSets } from "./builder_loadout_math.js";
import { lowerName, selectedWargearEntries } from "./builder_model.js";

function limitedChoiceItems(choiceId) {
  return choiceItems(state.catalog.limitedWargearChoiceItemsByChoiceId.get(choiceId));
}

function allModelChoiceItems(choiceId) {
  return choiceItems(state.catalog.allModelWargearChoiceItemsByChoiceId.get(choiceId));
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

function selectedWargearCounts(unit, predicate) {
  const counts = {};
  for (const entry of selectedWargearEntries(unit)) {
    if (!predicate(entry)) {
      continue;
    }
    const optionRow = state.catalog.wargearOptionById.get(entry.optionId);
    if (!optionRow) {
      continue;
    }
    const item = state.catalog.wargearItemById.get(optionRow.wargearItemId);
    if (item) {
      counts[lowerName(item.name)] = (counts[lowerName(item.name)] || 0) + (entry.count || 0);
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
  return eligible.length ? eligible[eligible.length - 1] : rows[0];
}

function limitedWargearChoices(limitedSetId) {
  return (state.catalog.limitedWargearChoicesBySetId.get(limitedSetId) || [])
    .map((row) => limitedChoiceItems(row.id));
}

function limitedChoiceCoverIsValid(selectedCounts, choices, choiceLimit, duplicateLimit, mandatory = false) {
  const relevantKeys = new Set(choices.flatMap((choice) => Object.keys(choice)));
  const targetCounts = cleanCounts(Object.fromEntries(
    Object.entries(selectedCounts || {}).filter(([key]) => relevantKeys.has(key))
  ));
  if (!Object.keys(targetCounts).length) {
    return !mandatory;
  }
  const keys = Object.keys(targetCounts).sort();
  const target = keys.map((key) => targetCounts[key]);
  const vectors = choices
    .filter((choice) => Object.keys(choice).length && !Object.keys(choice).some((key) => !relevantKeys.has(key)))
    .map((choice) => keys.map((key) => choice[key] || 0))
    .filter((vector) => vector.some(Boolean));
  if (!vectors.length) {
    return false;
  }
  let states = new Map([[keys.map(() => 0).join(","), 0]]);
  const capPerChoice = duplicateLimit == null ? choiceLimit : Math.min(choiceLimit, duplicateLimit);
  for (const vector of vectors) {
    const nextStates = new Map(states);
    for (const [currentKey, used] of states.entries()) {
      const current = currentKey.split(",").map(Number);
      for (let repeats = 1; repeats <= capPerChoice; repeats += 1) {
        const totalUsed = used + repeats;
        if (totalUsed > choiceLimit) {
          break;
        }
        const candidate = current.map((value, index) => value + vector[index] * repeats);
        if (candidate.some((value, index) => value > target[index])) {
          break;
        }
        const key = candidate.join(",");
        const previous = nextStates.get(key);
        if (previous == null || totalUsed < previous) {
          nextStates.set(key, totalUsed);
        }
      }
    }
    states = nextStates;
  }
  const finalUsed = states.get(target.join(","));
  return finalUsed != null && finalUsed <= choiceLimit;
}

function validateLimitedWargearChoiceSets(unit, messages) {
  for (const row of state.catalog.limitedWargearChoiceSetsByDatasheetId.get(unit.datasheetId) || []) {
    const limit = effectiveWargearLimit(row.id, unit.modelCount || 0);
    if (!limit) {
      continue;
    }
    const selected = row.miniatureId
      ? selectedMiniatureWargearCounts(unit, row.miniatureId)
      : selectedRosterUnitWargearCounts(unit);
    const choices = limitedWargearChoices(row.id);
    if (!limitedChoiceCoverIsValid(selected, choices, limit.choiceLimit, limit.duplicateLimit, row.mandatory)) {
      messages.push({ level: "error", text: `Invalid wargear configuration for ${unit.name}.` });
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

function allModelWargearChoices(allModelSetId) {
  return (state.catalog.allModelWargearChoicesBySetId.get(allModelSetId) || []).map((row) => ({
    substitute: Boolean(row.substitute),
    items: allModelChoiceItems(row.id),
  }));
}

function validateAllModelWargearChoiceSets(unit, messages) {
  let invalid = false;
  for (const row of state.catalog.allModelWargearChoiceSetsByDatasheetId.get(unit.datasheetId) || []) {
    const choices = allModelWargearChoices(row.id);
    const baseChoices = choices.filter((choice) => !choice.substitute);
    const selected = row.miniatureId
      ? selectedMiniatureWargearCounts(unit, row.miniatureId)
      : selectedRosterUnitWargearCounts(unit);
    const modelCount = scopeModelCount(unit, row.miniatureId);
    if (modelCount <= 0) {
      continue;
    }
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
      invalid = true;
      continue;
    }
    if (activeBase.length === 1 && activeBase[0][1] + substituteCount !== modelCount) {
      invalid = true;
    }
  }
  if (invalid) {
    messages.push({ level: "error", text: `Invalid wargear configuration for ${unit.name}.` });
  }
}

function validateWargearEntryScope(unit, entry, messages) {
  const optionRow = state.catalog.wargearOptionById.get(entry.optionId);
  const item = optionRow ? state.catalog.wargearItemById.get(optionRow.wargearItemId) : null;
  const group = optionRow ? state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId) : null;
  const target = entryTargetMiniature(unit, entry);
  if (!optionRow || !group || group.datasheetId !== unit.datasheetId) {
    if (entryTargetsUnit(entry)) {
      messages.push({ level: "error", text: `${unit.name} has invalid unit wargear selected: ${item?.name || "unknown wargear"}.` });
    } else {
      messages.push({ level: "error", text: `${unit.name} has invalid wargear for ${target?.name || "model"}: ${item?.name || "unknown wargear"}.` });
    }
    return;
  }
  if (entryTargetsUnit(entry)) {
    if (group.miniatureId) {
      messages.push({ level: "error", text: `${unit.name} has invalid unit wargear selected: ${item?.name || "unknown wargear"}.` });
    }
    return;
  }
  const selectedMiniatureId = target?.miniatureId || entry.miniatureId || "";
  if (!group.miniatureId || group.miniatureId !== selectedMiniatureId) {
    messages.push({ level: "error", text: `${unit.name} has invalid wargear for ${target?.name || "model"}: ${item?.name || "unknown wargear"}.` });
  }
}

function validateWargearLoadouts(units, messages) {
  for (const unit of units) {
    for (const entry of selectedWargearEntries(unit)) {
      validateWargearEntryScope(unit, entry, messages);
    }
    if (!wargearLoadoutMatchesChoiceSets(unit.datasheetId, null, selectedUnitWargearCounts(unit), 1)) {
      messages.push({ level: "error", text: `${unit.name} has an invalid unit wargear configuration.` });
    }
    for (const miniature of unit.miniatures || []) {
      const selected = selectedMiniatureWargearCounts(unit, miniature);
      if (miniature.count === 0) {
        if (Object.keys(selected).length) {
          messages.push({ level: "error", text: `${unit.name} has wargear selected for a model count of 0: ${miniature.name}.` });
        }
        continue;
      }
      if (!wargearLoadoutMatchesChoiceSets(unit.datasheetId, miniature.miniatureId, selected, miniature.count)) {
        messages.push({
          level: "error",
          text: unit.modelCount === 1
            ? `Invalid wargear selected for ${unit.name}.`
            : `Invalid wargear selected for ${miniature.name} model in ${unit.name}.`,
        });
      }
    }
    validateLimitedWargearChoiceSets(unit, messages);
    validateAllModelWargearChoiceSets(unit, messages);
  }
}

export { validateWargearLoadouts };
