import { unique } from "./builder_model.js";

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

function formatAttachmentList(values) {
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

export {
  ATTACHMENT_TYPES,
  attachmentTypeLabel,
  formatAttachmentList,
  unitAttachmentRoles,
  unitLabel,
};
