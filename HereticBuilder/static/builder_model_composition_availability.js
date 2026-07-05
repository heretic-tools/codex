import { state } from "./builder_state.js";
import {
  compositionIsAvailable,
  compositionShapeKey,
  compositionSpecificity,
} from "./builder_model_composition_filters.js";

function defaultComposition(datasheetId, factionKeywordIds, detachmentIds) {
  const compositions = [...(state.catalog.compositionsByDatasheetId.get(datasheetId) || [])]
    .filter((item) => compositionIsAvailable(item, factionKeywordIds, detachmentIds))
    .sort((left, right) => (
      Number(Boolean(right.isDefault)) - Number(Boolean(left.isDefault))
      || compositionSpecificity(right, factionKeywordIds, detachmentIds) - compositionSpecificity(left, factionKeywordIds, detachmentIds)
      || (left.displayOrder || 0) - (right.displayOrder || 0)
    ));
  return compositions[0] || null;
}

function availableCompositions(datasheetId, factionKeywordIds, detachmentIds) {
  const byShape = new Map();
  for (const composition of state.catalog.compositionsByDatasheetId.get(datasheetId) || []) {
    if (!compositionIsAvailable(composition, factionKeywordIds, detachmentIds)) {
      continue;
    }
    const shape = compositionShapeKey(composition) || composition.id;
    const previous = byShape.get(shape);
    if (!previous || (
      compositionSpecificity(composition, factionKeywordIds, detachmentIds) - compositionSpecificity(previous, factionKeywordIds, detachmentIds)
      || Number(Boolean(composition.isDefault)) - Number(Boolean(previous.isDefault))
      || (previous.displayOrder || 0) - (composition.displayOrder || 0)
    ) > 0) {
      byShape.set(shape, composition);
    }
  }
  return [...byShape.values()].sort((left, right) => (
      (left.displayOrder || 0) - (right.displayOrder || 0)
      || compositionSpecificity(right, factionKeywordIds, detachmentIds) - compositionSpecificity(left, factionKeywordIds, detachmentIds)
      || (left.points || 0) - (right.points || 0)
      || String(left.id || "").localeCompare(String(right.id || ""))
  ));
}

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

export {
  availableCompositions,
  compositionIsAvailable,
  defaultComposition,
  effectiveComposition,
};
