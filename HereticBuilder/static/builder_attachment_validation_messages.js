import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";

function attachedUnitMustAttachMessage(group, attached) {
  return unitValidationMessage("attached_unit.must_be_attached", attached, `${attached.name} must be attached to a bodyguard unit.`, {
    attachmentId: group.id,
  });
}

function attachedUnitIncompleteMessage(group) {
  return validationMessage(
    "attached_unit.incomplete",
    `Attached unit ${group.id} is incomplete.`,
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
  attachedUnitIncompleteMessage,
  attachedUnitMissingRequirementsMessage,
  attachedUnitMustAttachMessage,
};
