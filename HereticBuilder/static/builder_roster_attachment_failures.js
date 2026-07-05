import { state } from "./builder_state.js";
import { attachmentFailureMessage } from "./builder_roster_attachment_failure_messages.js";
import { attachmentRuleFailures } from "./builder_roster_attachment_rule_failures.js";

function attachmentPairFailures(roster, attachedUnit, bodyguardUnit, attachmentType) {
  const detachmentIds = new Set(roster.detachmentIds || []);
  const rows = (state.catalog.datasheetBodyguardGroupsByDatasheetId.get(attachedUnit.datasheetId) || [])
    .filter((row) => row.bodyguardType === attachmentType);
  if (!rows.length) {
    return [{ type: "no-rule", name: attachedUnit.name || "unit" }];
  }
  const failures = [];
  for (const row of rows) {
    const rowFailures = attachmentRuleFailures(roster, detachmentIds, row, attachedUnit, bodyguardUnit);
    if (!rowFailures.length) {
      return [];
    }
    failures.push(...rowFailures);
  }
  return failures;
}

export {
  attachmentFailureMessage,
  attachmentPairFailures,
};
