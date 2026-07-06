import { setIntersects } from "./builder_model.js";
import {
  bodyguardDatasheetIdsForRule,
  bodyguardKeywordIdsForRule,
} from "./builder_roster_attachment_rule_catalog.js";

function selectedDetachmentSet(detachmentIds) {
  return detachmentIds instanceof Set ? detachmentIds : new Set(detachmentIds || []);
}

function attachmentRuleConditionFailures(roster, detachmentIds, row, attachedUnit, bodyguardUnit) {
  const selectedDetachmentIds = selectedDetachmentSet(detachmentIds);
  const failures = [];
  if (row.factionKeywordId && row.factionKeywordId !== roster.factionKeywordId) {
    failures.push({ type: "faction", id: row.factionKeywordId });
  }
  if (row.excludedDetachmentId && selectedDetachmentIds.has(row.excludedDetachmentId)) {
    failures.push({ type: "excluded-detachment", id: row.excludedDetachmentId });
  }
  if (row.requiredDetachmentId && !selectedDetachmentIds.has(row.requiredDetachmentId)) {
    failures.push({ type: "required-detachment", id: row.requiredDetachmentId });
  }
  const allowedDatasheets = bodyguardDatasheetIdsForRule(row);
  if (allowedDatasheets.size && !allowedDatasheets.has(bodyguardUnit.datasheetId)) {
    failures.push({ type: "bodyguard-datasheet" });
  }
  const allowedKeywordIds = bodyguardKeywordIdsForRule(row);
  if (allowedKeywordIds.size && !setIntersects(new Set(bodyguardUnit.keywordIds || []), allowedKeywordIds)) {
    failures.push({ type: "bodyguard-keyword", ids: [...allowedKeywordIds] });
  }
  if (row.requiresAllUnitsHaveKeywordId) {
    const attachedHasKeyword = (attachedUnit.keywordIds || []).includes(row.requiresAllUnitsHaveKeywordId);
    const bodyguardHasKeyword = (bodyguardUnit.keywordIds || []).includes(row.requiresAllUnitsHaveKeywordId);
    if (!attachedHasKeyword || !bodyguardHasKeyword) {
      failures.push({ type: "shared-keyword", id: row.requiresAllUnitsHaveKeywordId });
    }
  }
  return failures;
}

function attachmentRuleMatches(roster, detachmentIds, row, attachedUnit, bodyguardUnit) {
  return !attachmentRuleConditionFailures(roster, detachmentIds, row, attachedUnit, bodyguardUnit).length;
}

export {
  attachmentRuleConditionFailures,
  attachmentRuleMatches,
};
