import { factionScope, selectedAllegianceAbilities } from "./builder_model.js";
import { state } from "./builder_state.js";

function detachmentIdsFor(roster, detachments) {
  const ids = new Set((roster?.detachmentIds || []).filter(Boolean));
  for (const detachment of detachments || []) {
    if (detachment?.id) {
      ids.add(detachment.id);
    }
  }
  return ids;
}

function mandatoryAllegianceRowsForRoster(roster) {
  const rows = [];
  const seenAbilityIds = new Set();
  for (const factionId of factionScope(roster.factionKeywordId)) {
    for (const row of state.catalog.mandatoryAllegianceAbilitiesByFactionId.get(factionId) || []) {
      if (seenAbilityIds.has(row.allegianceAbilityId)) {
        continue;
      }
      seenAbilityIds.add(row.allegianceAbilityId);
      rows.push(row);
    }
  }
  return rows;
}

function selectedCountForGroup(units, groupId, currentUnitId) {
  let count = 0;
  let currentUnitSelected = false;
  for (const unit of units || []) {
    const selected = selectedAllegianceAbilities(unit).filter((ability) => ability.groupId === groupId);
    if (unit.id === currentUnitId && selected.length) {
      currentUnitSelected = true;
    }
    count += selected.length;
  }
  return { count, currentUnitSelected };
}

export {
  detachmentIdsFor,
  mandatoryAllegianceRowsForRoster,
  selectedCountForGroup,
};
