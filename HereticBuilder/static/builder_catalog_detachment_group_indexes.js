import { groupBy } from "./builder_catalog_index_helpers.js";

function buildDetachmentGroupIndexes(tables) {
  const {
    detachmentUniqueKeywords,
    detachmentRequiredDatasheets,
    detachmentLinkedDatasheets,
    detachmentMandatoryWarlordMiniatures,
    detachmentGrantedWarlordMiniatures,
    detachmentForceDispositions,
  } = tables;

  return {
    detachmentUniqueKeywordsByDetachmentId: groupBy(detachmentUniqueKeywords, "detachmentId"),
    detachmentRequiredDatasheetsByDetachmentId: groupBy(detachmentRequiredDatasheets, "detachmentId"),
    detachmentLinkedDatasheetsByDetachmentId: groupBy(detachmentLinkedDatasheets, "detachmentId"),
    detachmentMandatoryWarlordsByDetachmentId: groupBy(detachmentMandatoryWarlordMiniatures, "detachmentId"),
    detachmentGrantedWarlordsByMiniatureId: groupBy(detachmentGrantedWarlordMiniatures, "miniatureId"),
    forceDispositionsByDetachmentId: groupBy(detachmentForceDispositions, "detachmentId"),
  };
}

export { buildDetachmentGroupIndexes };
