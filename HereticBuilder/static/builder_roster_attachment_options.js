import { idsFromRows, setIntersects, unique } from "./builder_model.js";
import { state } from "./builder_state.js";

const ATTACHMENT_TYPES = [
  { value: "leader", label: "Leader" },
  { value: "support", label: "Support" },
];

function unitLabel(unit, prefix = "", units = []) {
  const name = unit.name || "Unit";
  const sameName = units.filter((item) => (item.name || "Unit") === name);
  const duplicateSuffix = sameName.length > 1 ? ` #${sameName.findIndex((item) => item.id === unit.id) + 1}` : "";
  const label = `${name}${duplicateSuffix} (${unit.modelCount || 0})`;
  return prefix ? `${prefix}: ${label}` : label;
}

function attachmentTypeLabel(type) {
  if (type === "bodyguard") {
    return "Bodyguard";
  }
  return ATTACHMENT_TYPES.find((item) => item.value === type)?.label || "Attached";
}

function unitAttachmentRoles(roster, unitId) {
  const roles = [];
  for (const attachment of roster.attachments || []) {
    for (const member of attachment.members || []) {
      if (member.rosterUnitId === unitId) {
        roles.push(member.attachmentType);
      }
    }
  }
  return roles;
}

function nameForId(mapName, id, fallback) {
  return state.catalog?.[mapName]?.get(id)?.name || fallback;
}

function formatList(values) {
  const allNames = unique(values);
  const names = allNames.slice(0, 5);
  if (!names.length) {
    return "";
  }
  const suffix = allNames.length > names.length ? `, +${allNames.length - names.length} more` : "";
  if (names.length === 1) {
    return `${names[0]}${suffix}`;
  }
  if (names.length === 2) {
    return `${names[0]} or ${names[1]}${suffix}`;
  }
  return `${names.slice(0, -1).join(", ")}, or ${names[names.length - 1]}${suffix}`;
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
      name: formatList([...allowedKeywordIds].map((id) => nameForId("keywordById", id, "required keyword"))),
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

function unitCanAttachToBodyguard(roster, attachedUnit, bodyguardUnit, attachmentType) {
  const detachmentIds = new Set(roster.detachmentIds || []);
  const rows = (state.catalog.datasheetBodyguardGroupsByDatasheetId.get(attachedUnit.datasheetId) || [])
    .filter((row) => row.bodyguardType === attachmentType);
  for (const row of rows) {
    if (!attachmentRuleFailures(roster, detachmentIds, row, attachedUnit, bodyguardUnit).length) {
      return true;
    }
  }
  return false;
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

function attachableUnits(roster, units, bodyguardUnit, attachmentType) {
  return units.filter((unit) => {
    if (unit.id === bodyguardUnit.id) {
      return false;
    }
    if (unitAttachmentRoles(roster, unit.id).length) {
      return false;
    }
    return unitCanAttachToBodyguard(roster, unit, bodyguardUnit, attachmentType);
  });
}

function availableAttachmentTypes(roster, units, bodyguardUnit) {
  return ATTACHMENT_TYPES.filter((item) => (
    attachableUnits(roster, units, bodyguardUnit, item.value).length
  ));
}

function bodyguardRows(roster, units) {
  return units.filter((unit) => {
    const roles = unitAttachmentRoles(roster, unit.id);
    if (roles.includes("leader") || roles.includes("support")) {
      return false;
    }
    return availableAttachmentTypes(roster, units, unit).length;
  });
}

function attachmentUnavailableMessage(roster, units, bodyguards = bodyguardRows(roster, units)) {
  if (units.length < 2) {
    return "Add at least two units";
  }
  if (bodyguards.length) {
    return "No attached units";
  }
  const bodyguardCandidates = units.filter((unit) => {
    const roles = unitAttachmentRoles(roster, unit.id);
    return !roles.includes("leader") && !roles.includes("support");
  });
  const attachedCandidates = units.filter((unit) => !unitAttachmentRoles(roster, unit.id).length);
  const failures = [];
  for (const bodyguardUnit of bodyguardCandidates) {
    for (const attachedUnit of attachedCandidates) {
      if (attachedUnit.id === bodyguardUnit.id) {
        continue;
      }
      for (const attachmentType of ATTACHMENT_TYPES) {
        failures.push(...attachmentPairFailures(roster, attachedUnit, bodyguardUnit, attachmentType.value));
      }
    }
  }

  const sharedKeywords = failures
    .filter((failure) => failure.type === "shared-keyword")
    .map((failure) => failure.name);
  if (sharedKeywords.length) {
    return `No valid attached units: requires both units to share ${formatList(sharedKeywords)}.`;
  }
  const requiredDetachments = failures
    .filter((failure) => failure.type === "required-detachment")
    .map((failure) => failure.name);
  if (requiredDetachments.length) {
    return `No valid attached units: requires ${formatList(requiredDetachments)}.`;
  }
  const excludedDetachments = failures
    .filter((failure) => failure.type === "excluded-detachment")
    .map((failure) => failure.name);
  if (excludedDetachments.length) {
    return `No valid attached units: blocked by ${formatList(excludedDetachments)}.`;
  }
  const factionNames = failures
    .filter((failure) => failure.type === "faction")
    .map((failure) => failure.name);
  if (factionNames.length) {
    return `No valid attached units: requires ${formatList(factionNames)}.`;
  }
  const bodyguardKeywords = failures
    .filter((failure) => failure.type === "bodyguard-keyword")
    .map((failure) => failure.name);
  if (bodyguardKeywords.length) {
    return `No valid attached units: bodyguard needs ${formatList(bodyguardKeywords)}.`;
  }
  const bodyguardDatasheets = failures.filter((failure) => failure.type === "bodyguard-datasheet");
  if (bodyguardDatasheets.length) {
    return "No valid attached units: bodyguard datasheet is not allowed.";
  }
  return "No valid attached units";
}

export {
  ATTACHMENT_TYPES,
  attachableUnits,
  attachmentTypeLabel,
  attachmentUnavailableMessage,
  availableAttachmentTypes,
  bodyguardRows,
  unitLabel,
};
