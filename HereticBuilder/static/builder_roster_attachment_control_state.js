import { emptyAttachmentControlOptions } from "./builder_roster_attachment_control_options.js";

function disableAttachmentControlSelects({ add, attached, bodyguard, controls, type }) {
  const emptyOptions = emptyAttachmentControlOptions();
  bodyguard.replaceChildren(emptyOptions.bodyguard);
  type.replaceChildren(emptyOptions.type);
  attached.replaceChildren(emptyOptions.attached);
  bodyguard.disabled = true;
  type.disabled = true;
  attached.disabled = true;
  add.disabled = true;
  controls.hidden = true;
}

function preservedAttachmentControlValue(rows, previousValue, fallbackValue, key = "id") {
  return rows.some((row) => row[key] === previousValue)
    ? previousValue
    : fallbackValue;
}

function updateAttachmentControlDisabledState({
  add,
  attached,
  attachedRows,
  bodyguard,
  controls,
  type,
  typeRows,
}) {
  bodyguard.disabled = false;
  type.disabled = !typeRows.length;
  attached.disabled = !attachedRows.length;
  add.disabled = !bodyguard.value || !attached.value;
  controls.hidden = false;
}

export {
  disableAttachmentControlSelects,
  preservedAttachmentControlValue,
  updateAttachmentControlDisabledState,
};
