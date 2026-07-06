import { state } from "./builder_state.js";
import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";

function detachmentDatasheetNotAllowedMessage(detachment, unit) {
  return unitValidationMessage("detachment.datasheet_not_allowed", unit, `${unit.name} is excluded from ${detachment.name}.`, {
    detachmentId: detachment.id,
  });
}

function detachmentDatasheetMissingMessage(detachment, row) {
  const datasheet = state.catalog.datasheetById.get(row.datasheetId);
  return validationMessage(
    "detachment.datasheets_missing",
    `${detachment.name} requires ${datasheet?.name || "a required unit"}.`,
    "error",
    { detachmentId: detachment.id, datasheetId: row.datasheetId }
  );
}

function linkedDatasheetCountMismatchMessage(detachment, linked, actual) {
  const datasheet = state.catalog.datasheetById.get(linked.datasheetId);
  return validationMessage(
    "detachment.linked_datasheet_count_mismatch",
    `${detachment.name} requires exactly ${linked.count} ${datasheet?.name || "linked"} unit(s); roster has ${actual}.`,
    "error",
    { datasheetId: linked.datasheetId, detachmentId: detachment.id }
  );
}

function linkedDatasheetNotAllowedMessage(detachment, unit) {
  return unitValidationMessage("detachment.linked_datasheet_not_allowed", unit, `${unit.name} is not part of ${detachment.name}.`, {
    detachmentId: detachment.id,
  });
}

export {
  detachmentDatasheetMissingMessage,
  detachmentDatasheetNotAllowedMessage,
  linkedDatasheetCountMismatchMessage,
  linkedDatasheetNotAllowedMessage,
};
