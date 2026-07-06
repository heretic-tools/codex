import { validationForDetachment } from "./builder_validation_view.js";

function detachmentValidationStatus(validation, detachmentId) {
  const messages = validationForDetachment(validation, detachmentId).messages || [];
  const errors = messages.filter((message) => message.level === "error").length;
  const warnings = messages.filter((message) => message.level === "warning").length;
  if (errors) {
    return { className: "error", text: `${errors} error${errors === 1 ? "" : "s"}` };
  }
  if (warnings) {
    return { className: "warning", text: `${warnings} warning${warnings === 1 ? "" : "s"}` };
  }
  return null;
}

export { detachmentValidationStatus };
