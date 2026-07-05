import { canonicalWargearKey, cleanCounts } from "./builder_loadout_math.js";
import { selectedWargearEntries } from "./builder_model.js";
import { state } from "./builder_state.js";

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

function targetIdForMiniature(unit, miniatureId) {
  const miniature = (unit.miniatures || []).find((item) => item.miniatureId === miniatureId);
  return miniature?.rosterUnitMiniatureId || miniature?.id || miniature?.miniatureId || miniatureId || "";
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

export {
  entryMatchesMiniature,
  entryTargetMiniature,
  entryTargetsUnit,
  scopeModelCount,
  selectedMiniatureWargearCounts,
  selectedRosterUnitWargearCounts,
  selectedUnitWargearCounts,
  selectedWargearCounts,
  targetIdForMiniature,
};
