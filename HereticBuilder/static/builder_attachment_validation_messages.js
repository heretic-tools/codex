import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";

function attachedUnitMemberNames(group, units = []) {
  const unitById = new Map((units || []).map((unit) => [unit.id, unit]));
  return (group.members || [])
    .map((member) => unitById.get(member.rosterUnitId)?.name)
    .filter(Boolean);
}

function attachedUnitLabel(group, units = []) {
  const names = attachedUnitMemberNames(group, units);
  return names.length ? `attached unit with ${names.join(" + ")}` : "attached unit";
}

function sentenceCase(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function attachedUnitSentenceLabel(group, units = []) {
  return sentenceCase(attachedUnitLabel(group, units));
}

function attachedUnitMustAttachMessage(group, attached) {
  return unitValidationMessage("attached_unit.must_be_attached", attached, `${attached.name} must be attached to a bodyguard unit.`, {
    attachmentId: group.id,
  });
}

function attachedUnitIncompleteMessage(group, units = []) {
  return validationMessage(
    "attached_unit.incomplete",
    `${attachedUnitSentenceLabel(group, units)} is incomplete.`,
    "error",
    { attachmentId: group.id }
  );
}

function attachedUnitMissingRequirementsMessage(group, attached, bodyguard) {
  return validationMessage(
    "attached_unit.missing_requirements",
    `${attached.name} cannot attach to ${bodyguard.name} as ${attached.attachmentType}.`,
    "error",
    {
      attachmentId: group.id,
      unitIds: [attached.id, bodyguard.id].filter(Boolean),
      datasheetIds: [attached.datasheetId, bodyguard.datasheetId].filter(Boolean),
    }
  );
}

export {
  attachedUnitSentenceLabel,
  attachedUnitIncompleteMessage,
  attachedUnitMissingRequirementsMessage,
  attachedUnitMustAttachMessage,
};
