import { factionScope } from "./builder_model.js";
import { state } from "./builder_state.js";

function mandatoryWarlordForRoster(roster) {
  const faction = factionScope(roster.factionKeywordId)
    .map((id) => state.catalog.factionKeywordById.get(id) || state.catalog.factionById.get(id))
    .find((item) => item?.mandatoryWarlordId)
    || state.catalog.factionKeywordById.get(roster.factionKeywordId)
    || state.catalog.factionById.get(roster.factionKeywordId)
    || {};
  return {
    faction,
    mandatoryWarlordId: faction.mandatoryWarlordId,
    mandatoryWarlord: faction.mandatoryWarlordId ? state.catalog.miniatureById.get(faction.mandatoryWarlordId) : null,
  };
}

function detachmentMandatoryWarlordRows(detachments) {
  return detachments.flatMap((detachment) => (
    (state.catalog.detachmentMandatoryWarlordsByDetachmentId.get(detachment.id) || [])
      .map((row) => ({ ...row, detachmentName: detachment.name }))
  ));
}

export { detachmentMandatoryWarlordRows, mandatoryWarlordForRoster };
