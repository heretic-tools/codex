import {
  attachedUnitControlOptions,
  attachedUnitControlRows,
  attachmentTypeControlOptions,
  attachmentTypeControlRows,
  bodyguardControlOptions,
  emptyAttachmentControlOptions,
} from "./builder_roster_attachment_control_options.js";

function createAttachmentControlSelects() {
  const bodyguard = document.createElement("select");
  bodyguard.dataset.focusTarget = "true";
  return {
    attached: document.createElement("select"),
    bodyguard,
    type: document.createElement("select"),
  };
}

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

function refreshAttachmentControlSelects({
  add,
  attached,
  bodyguard,
  bodyguards,
  controls,
  roster,
  type,
  units,
  unitsById,
}) {
  if (!bodyguards.length) {
    disableAttachmentControlSelects({ add, attached, bodyguard, controls, type });
    return;
  }

  const previousBodyguard = bodyguard.value;
  bodyguard.replaceChildren(...bodyguardControlOptions(bodyguards, units));
  bodyguard.value = bodyguards.some((unit) => unit.id === previousBodyguard)
    ? previousBodyguard
    : bodyguards[0]?.id || "";

  const selectedBodyguard = unitsById.get(bodyguard.value);
  const typeRows = attachmentTypeControlRows(roster, units, selectedBodyguard);
  const previousType = type.value;
  type.replaceChildren(...attachmentTypeControlOptions(typeRows));
  type.value = typeRows.some((item) => item.value === previousType)
    ? previousType
    : typeRows[0]?.value || "";

  const attachedRows = attachedUnitControlRows(roster, units, selectedBodyguard, type.value);
  const previousAttached = attached.value;
  attached.replaceChildren(...attachedUnitControlOptions(attachedRows, type.value, units));
  attached.value = attachedRows.some((unit) => unit.id === previousAttached)
    ? previousAttached
    : attachedRows[0]?.id || "";

  bodyguard.disabled = false;
  type.disabled = !typeRows.length;
  attached.disabled = !attachedRows.length;
  add.disabled = !bodyguard.value || !attached.value;
  controls.hidden = false;
}

export {
  createAttachmentControlSelects,
  refreshAttachmentControlSelects,
};
