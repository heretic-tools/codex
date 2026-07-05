import { state } from "./builder_state.js";
import { factionScope, namesForIds, unique } from "./builder_model.js";

function alliedFactionName(alliedFactionId) {
  const parentNames = (state.catalog.alliedFactionParentsByAlliedFactionId.get(alliedFactionId) || [])
    .map((row) => state.catalog.factionKeywordById.get(row.factionKeywordId)?.name)
    .filter(Boolean);
  return parentNames.length ? parentNames.join(", ") : "Allied";
}

function miniatureNames(miniatureIds) {
  return namesForIds(state.catalog.miniatureById, miniatureIds, "required model");
}

function detachmentNames(detachmentIds) {
  return namesForIds(state.catalog.detachmentById, detachmentIds, "required detachment");
}

function unitIdsScope(units, extra = {}) {
  const unitIds = unique(units.map((unit) => unit.id).filter(Boolean));
  const scope = { ...extra };
  if (unitIds.length) {
    scope.unitIds = unitIds;
  }
  return Object.keys(scope).length ? scope : null;
}

function alliedFactionParentMatches(alliedFactionId, factionKeywordId) {
  if (!factionKeywordId) {
    return true;
  }
  return (state.catalog.alliedFactionParentsByAlliedFactionId.get(alliedFactionId) || [])
    .some((row) => factionScope(row.factionKeywordId).includes(factionKeywordId));
}

export {
  alliedFactionName,
  alliedFactionParentMatches,
  detachmentNames,
  miniatureNames,
  unitIdsScope,
};
