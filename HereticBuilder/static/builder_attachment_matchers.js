import { idsFromRows, setIntersects } from "./builder_model.js";
import { state } from "./builder_state.js";

function attachedGroups(roster) {
  return roster.attachments || [];
}

function attachedUnitCanAttach(roster, detachmentIds, attached, bodyguard, units) {
  const rows = (state.catalog.datasheetBodyguardGroupsByDatasheetId.get(attached.datasheetId) || [])
    .filter((row) => row.bodyguardType === attached.attachmentType);
  const detachmentSet = new Set(detachmentIds);
  for (const row of rows) {
    if (row.factionKeywordId && row.factionKeywordId !== roster.factionKeywordId) {
      continue;
    }
    if (row.excludedDetachmentId && detachmentSet.has(row.excludedDetachmentId)) {
      continue;
    }
    if (row.requiredDetachmentId && !detachmentSet.has(row.requiredDetachmentId)) {
      continue;
    }
    const datasheets = new Set(idsFromRows(
      state.catalog.datasheetBodyguardGroupDatasheetsByGroupId.get(row.id),
      "datasheetId"
    ));
    const keywordIds = new Set(idsFromRows(
      state.catalog.datasheetBodyguardGroupKeywordsByGroupId.get(row.id),
      "keywordId"
    ));
    if (datasheets.size && !datasheets.has(bodyguard.datasheetId)) {
      continue;
    }
    if (keywordIds.size && !setIntersects(new Set(bodyguard.keywordIds || []), keywordIds)) {
      continue;
    }
    if (row.requiresAllUnitsHaveKeywordId) {
      if (!(attached.keywordIds || []).includes(row.requiresAllUnitsHaveKeywordId)) {
        continue;
      }
      if (!(bodyguard.keywordIds || []).includes(row.requiresAllUnitsHaveKeywordId)) {
        continue;
      }
    }
    return Boolean(units);
  }
  return false;
}

export {
  attachedGroups,
  attachedUnitCanAttach,
};
