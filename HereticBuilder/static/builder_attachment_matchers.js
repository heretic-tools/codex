import { attachmentRuleMatches } from "./builder_attachment_rule_conditions.js";
import { state } from "./builder_state.js";

function attachedGroups(roster) {
  return roster.attachments || [];
}

function attachedUnitCanAttach(roster, detachmentIds, attached, bodyguard, units) {
  const rows = (state.catalog.datasheetBodyguardGroupsByDatasheetId.get(attached.datasheetId) || [])
    .filter((row) => row.bodyguardType === attached.attachmentType);
  for (const row of rows) {
    if (attachmentRuleMatches(roster, detachmentIds, row, attached, bodyguard)) {
      return Boolean(units);
    }
  }
  return false;
}

export {
  attachedGroups,
  attachedUnitCanAttach,
};
