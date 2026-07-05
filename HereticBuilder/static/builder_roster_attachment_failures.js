import { idsFromRows, setIntersects } from "./builder_model.js";
import { state } from "./builder_state.js";
import { formatAttachmentList } from "./builder_roster_attachment_types.js";

function nameForId(mapName, id, fallback) {
  return state.catalog?.[mapName]?.get(id)?.name || fallback;
}

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
  const allowedDatasheets = new Set(idsFromRows(
    state.catalog.datasheetBodyguardGroupDatasheetsByGroupId.get(row.id),
    "datasheetId"
  ));
  if (allowedDatasheets.size && !allowedDatasheets.has(bodyguardUnit.datasheetId)) {
    failures.push({ type: "bodyguard-datasheet", name: bodyguardUnit.name || "bodyguard" });
  }
  const allowedKeywordIds = new Set(idsFromRows(
    state.catalog.datasheetBodyguardGroupKeywordsByGroupId.get(row.id),
    "keywordId"
  ));
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

function namesForFailures(failures, type) {
  return failures
    .filter((failure) => failure.type === type)
    .map((failure) => failure.name);
}

function attachmentFailureMessage(failures) {
  const sharedKeywords = namesForFailures(failures, "shared-keyword");
  if (sharedKeywords.length) {
    return `No valid attached units: requires both units to share ${formatAttachmentList(sharedKeywords)}.`;
  }
  const requiredDetachments = namesForFailures(failures, "required-detachment");
  if (requiredDetachments.length) {
    return `No valid attached units: requires ${formatAttachmentList(requiredDetachments)}.`;
  }
  const excludedDetachments = namesForFailures(failures, "excluded-detachment");
  if (excludedDetachments.length) {
    return `No valid attached units: blocked by ${formatAttachmentList(excludedDetachments)}.`;
  }
  const factionNames = namesForFailures(failures, "faction");
  if (factionNames.length) {
    return `No valid attached units: requires ${formatAttachmentList(factionNames)}.`;
  }
  const bodyguardKeywords = namesForFailures(failures, "bodyguard-keyword");
  if (bodyguardKeywords.length) {
    return `No valid attached units: bodyguard needs ${formatAttachmentList(bodyguardKeywords)}.`;
  }
  if (failures.some((failure) => failure.type === "bodyguard-datasheet")) {
    return "No valid attached units: bodyguard datasheet is not allowed.";
  }
  return "No valid attached units";
}

export {
  attachmentFailureMessage,
  attachmentPairFailures,
};
