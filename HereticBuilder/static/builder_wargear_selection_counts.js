import { canonicalWargearKey, cleanCounts } from "./builder_loadout_math.js";
import { selectedWargearEntries } from "./builder_model.js";
import { state } from "./builder_state.js";
import { entryMatchesMiniature, entryTargetsUnit } from "./builder_wargear_entry_targets.js";

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

export {
  selectedMiniatureWargearCounts,
  selectedRosterUnitWargearCounts,
  selectedUnitWargearCounts,
  selectedWargearCounts,
};
