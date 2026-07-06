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

export {
  ATTACHMENT_TYPES,
  attachmentTypeLabel,
  unitAttachmentRoles,
  unitLabel,
};
