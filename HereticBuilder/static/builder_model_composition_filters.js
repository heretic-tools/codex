import { state } from "./builder_state.js";

function compositionIsAvailable(composition, factionKeywordIds, detachmentIds) {
  const requiredFactionIds = state.catalog.requiredFactionKeywordsByCompositionId
    .get(composition.id)
    ?.map((row) => row.factionKeywordId) || [];
  if (requiredFactionIds.length && !requiredFactionIds.some((id) => factionKeywordIds.includes(id))) {
    return false;
  }
  const requiredDetachmentIds = state.catalog.requiredDetachmentsByCompositionId
    .get(composition.id)
    ?.map((row) => row.detachmentId) || [];
  if (requiredDetachmentIds.length && !requiredDetachmentIds.some((id) => detachmentIds.includes(id))) {
    return false;
  }
  return true;
}

function compositionSpecificity(composition, factionKeywordIds, detachmentIds) {
  const requiredDetachmentIds = state.catalog.requiredDetachmentsByCompositionId
    .get(composition.id)
    ?.map((row) => row.detachmentId) || [];
  const requiredFactionIds = state.catalog.requiredFactionKeywordsByCompositionId
    .get(composition.id)
    ?.map((row) => row.factionKeywordId) || [];
  const detachmentSpecific = requiredDetachmentIds.some((id) => detachmentIds.includes(id)) ? 2 : 0;
  const factionSpecific = requiredFactionIds.some((id) => factionKeywordIds.includes(id)) ? 1 : 0;
  return detachmentSpecific + factionSpecific;
}

function compositionShapeKey(composition) {
  return (state.catalog.compositionMiniaturesByCompositionId.get(composition?.id) || [])
    .map((row) => `${row.miniatureId}:${Number(row.min || 0)}-${Number(row.max || 0)}`)
    .sort()
    .join("|");
}

export {
  compositionIsAvailable,
  compositionShapeKey,
  compositionSpecificity,
};
