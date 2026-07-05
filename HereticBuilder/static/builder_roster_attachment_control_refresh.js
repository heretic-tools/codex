import {
  attachedUnitControlOptions,
  attachedUnitControlRows,
  attachmentTypeControlOptions,
  attachmentTypeControlRows,
  bodyguardControlOptions,
} from "./builder_roster_attachment_control_options.js";
import {
  disableAttachmentControlSelects,
  preservedAttachmentControlValue,
  updateAttachmentControlDisabledState,
} from "./builder_roster_attachment_control_state.js";

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
  bodyguard.value = preservedAttachmentControlValue(bodyguards, previousBodyguard, bodyguards[0]?.id || "");

  const selectedBodyguard = unitsById.get(bodyguard.value);
  const typeRows = attachmentTypeControlRows(roster, units, selectedBodyguard);
  const previousType = type.value;
  type.replaceChildren(...attachmentTypeControlOptions(typeRows));
  type.value = preservedAttachmentControlValue(typeRows, previousType, typeRows[0]?.value || "", "value");

  const attachedRows = attachedUnitControlRows(roster, units, selectedBodyguard, type.value);
  const previousAttached = attached.value;
  attached.replaceChildren(...attachedUnitControlOptions(attachedRows, type.value, units));
  attached.value = preservedAttachmentControlValue(attachedRows, previousAttached, attachedRows[0]?.id || "");

  updateAttachmentControlDisabledState({
    add,
    attached,
    attachedRows,
    bodyguard,
    controls,
    type,
    typeRows,
  });
}

export { refreshAttachmentControlSelects };
