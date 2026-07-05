import { defaultComposition } from "./builder_model_composition_choices.js";
import {
  compositionIsAvailable,
  compositionShapeKey,
  compositionSpecificity,
} from "./builder_model_composition_filters.js";
import { state } from "./builder_state.js";

function moreSpecificEquivalentComposition(datasheetId, saved, factionKeywordIds, detachmentIds) {
  const savedShape = compositionShapeKey(saved);
  if (!savedShape) {
    return null;
  }
  const savedSpecificity = compositionSpecificity(saved, factionKeywordIds, detachmentIds);
  return [...(state.catalog.compositionsByDatasheetId.get(datasheetId) || [])]
    .filter((item) => item.id !== saved.id)
    .filter((item) => compositionShapeKey(item) === savedShape)
    .filter((item) => compositionIsAvailable(item, factionKeywordIds, detachmentIds))
    .filter((item) => compositionSpecificity(item, factionKeywordIds, detachmentIds) > savedSpecificity)
    .sort((left, right) => (
      compositionSpecificity(right, factionKeywordIds, detachmentIds) - compositionSpecificity(left, factionKeywordIds, detachmentIds)
      || Number(Boolean(right.isDefault)) - Number(Boolean(left.isDefault))
      || (left.displayOrder || 0) - (right.displayOrder || 0)
    ))[0] || null;
}

function effectiveComposition(unit, factionKeywordIds, detachmentIds) {
  const fallback = defaultComposition(unit.datasheetId, factionKeywordIds, detachmentIds);
  const saved = state.catalog.compositionById.get(unit.compositionId);
  if (!saved || !compositionIsAvailable(saved, factionKeywordIds, detachmentIds)) {
    return fallback;
  }
  const equivalent = moreSpecificEquivalentComposition(unit.datasheetId, saved, factionKeywordIds, detachmentIds);
  if (equivalent) {
    return equivalent;
  }
  if (
    saved.isDefault
    && fallback?.isDefault
    && compositionSpecificity(fallback, factionKeywordIds, detachmentIds) > compositionSpecificity(saved, factionKeywordIds, detachmentIds)
  ) {
    return fallback;
  }
  return saved;
}

export { effectiveComposition };
