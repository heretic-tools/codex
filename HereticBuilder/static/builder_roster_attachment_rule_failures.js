import { setIntersects } from "./builder_model.js";
import {
  bodyguardDatasheetIdsForRule,
  bodyguardKeywordIdsForRule,
  nameForId,
} from "./builder_roster_attachment_rule_catalog.js";
import { formatAttachmentList } from "./builder_roster_attachment_list_format.js";

function attachmentRuleFailures(roster, detachmentIds, row, attachedUnit, bodyguardUnit) {
  const failures = [];
  if (row.factionKeywordId && row.factionKeywordId !== roster.factionKeywordId) {
    failures.push({
      type: "faction",
      name: nameForId("factionKeywordById", row.factionKeywordId, "required faction"),
    });
  }
  if (row.excludedDetachmentId && detachmentIds.has(row.excludedDetachmentId)) {
    failures.push({
      type: "excluded-detachment",
      name: nameForId("detachmentById", row.excludedDetachmentId, "selected detachment"),
    });
  }
  if (row.requiredDetachmentId && !detachmentIds.has(row.requiredDetachmentId)) {
    failures.push({
      type: "required-detachment",
      name: nameForId("detachmentById", row.requiredDetachmentId, "required detachment"),
    });
  }
  const allowedDatasheets = bodyguardDatasheetIdsForRule(row);
  if (allowedDatasheets.size && !allowedDatasheets.has(bodyguardUnit.datasheetId)) {
    failures.push({ type: "bodyguard-datasheet", name: bodyguardUnit.name || "bodyguard" });
  }
  const allowedKeywordIds = bodyguardKeywordIdsForRule(row);
  if (allowedKeywordIds.size && !setIntersects(new Set(bodyguardUnit.keywordIds || []), allowedKeywordIds)) {
    failures.push({
      type: "bodyguard-keyword",
      name: formatAttachmentList([...allowedKeywordIds].map((id) => nameForId("keywordById", id, "required keyword"))),
    });
  }
  if (row.requiresAllUnitsHaveKeywordId) {
    const attachedHasKeyword = (attachedUnit.keywordIds || []).includes(row.requiresAllUnitsHaveKeywordId);
    const bodyguardHasKeyword = (bodyguardUnit.keywordIds || []).includes(row.requiresAllUnitsHaveKeywordId);
    if (!attachedHasKeyword || !bodyguardHasKeyword) {
      failures.push({
        type: "shared-keyword",
        name: nameForId("keywordById", row.requiresAllUnitsHaveKeywordId, "required keyword"),
      });
    }
  }
  return failures;
}

export { attachmentRuleFailures };
