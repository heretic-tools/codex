import { validationMessageMatchesAttachment } from "./builder_validation_attachment_scopes.js";
import { validationMessageMatchesDetachment } from "./builder_validation_detachment_scopes.js";
import { validationMessageMatchesTarget } from "./builder_validation_target_scopes.js";
import { validationMessageMatchesUnit } from "./builder_validation_unit_scopes.js";

function validationState(messages) {
  return messages.some((message) => message.level === "error") ? "invalid" : "valid";
}

function validationWithMessages(validation, messages) {
  return {
    ...validation,
    state: validationState(messages),
    messages,
  };
}

function validationForUnit(validation, unit) {
  return validationWithMessages(
    validation,
    (validation.messages || []).filter((message) => validationMessageMatchesUnit(message, unit))
  );
}

function validationForDetachment(validation, detachmentId) {
  return validationWithMessages(
    validation,
    (validation.messages || []).filter((message) => validationMessageMatchesDetachment(message, detachmentId))
  );
}

function validationForAttachment(validation, attachment, unitsById = null) {
  return validationWithMessages(
    validation,
    (validation.messages || []).filter((message) => validationMessageMatchesAttachment(message, attachment, unitsById))
  );
}

function validationForTarget(validation, targetId) {
  return validationWithMessages(
    validation,
    (validation.messages || []).filter((message) => validationMessageMatchesTarget(message, targetId))
  );
}

export {
  validationForAttachment,
  validationForDetachment,
  validationForTarget,
  validationForUnit,
};
