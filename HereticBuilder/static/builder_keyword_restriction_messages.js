import { validationMessage } from "./builder_validation_messages.js";

function unitIdsScope(units, extra = {}) {
  const unitIds = [...new Set((units || []).map((unit) => unit.id).filter(Boolean))];
  const scope = { ...extra };
  if (unitIds.length) {
    scope.unitIds = unitIds;
  }
  return Object.keys(scope).length ? scope : null;
}

function addKeywordLimitMessage(messages, group, count, limit, detachment = null, affectedUnits = []) {
  const labels = group.keywordNames.join(", ");
  const scope = detachment ? ` in ${detachment.name}` : "";
  const prefix = group.excludedFactionKeywordName ? `Excluding ${group.excludedFactionKeywordName} units, ` : "";
  const messageScope = unitIdsScope(affectedUnits, detachment ? { detachmentId: detachment.id } : {});
  if (limit === 0) {
    messages.push(validationMessage("keyword_restriction_group.limit_zero", `${prefix}${labels} units are not allowed${scope}.`, "error", messageScope));
  } else {
    messages.push(validationMessage("keyword_restriction_group.limit_exceeded", `${prefix}${labels} has ${count} units${scope}; limit is ${limit}.`, "error", messageScope));
  }
}

export { addKeywordLimitMessage, unitIdsScope };
