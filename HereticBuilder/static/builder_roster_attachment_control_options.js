import { option } from "./builder_dom.js";
import {
  ATTACHMENT_TYPES,
  attachableUnits,
  availableAttachmentTypes,
  unitLabel,
} from "./builder_roster_attachment_options.js";

function emptyAttachmentControlOptions() {
  return {
    attached: option("", "Unit: none available"),
    bodyguard: option("", "Bodyguard: none available"),
    type: option("", "Attach as: none available"),
  };
}

function bodyguardControlOptions(bodyguards, units) {
  return bodyguards.map((unit) => option(unit.id, unitLabel(unit, "Bodyguard", units)));
}

function attachmentTypeControlRows(roster, units, selectedBodyguard) {
  return selectedBodyguard ? availableAttachmentTypes(roster, units, selectedBodyguard) : [];
}

function attachmentTypeControlOptions(typeRows) {
  return typeRows.map((item) => option(item.value, `Attach as: ${item.label}`));
}

function attachedUnitControlRows(roster, units, selectedBodyguard, attachmentType) {
  return selectedBodyguard
    ? attachableUnits(roster, units, selectedBodyguard, attachmentType)
    : [];
}

function attachedUnitControlOptions(attachedRows, attachmentType, units) {
  const selectedType = ATTACHMENT_TYPES.find((item) => item.value === attachmentType);
  return attachedRows.map((unit) => option(unit.id, unitLabel(unit, selectedType?.label || "Unit", units)));
}

export {
  attachedUnitControlOptions,
  attachedUnitControlRows,
  attachmentTypeControlOptions,
  attachmentTypeControlRows,
  bodyguardControlOptions,
  emptyAttachmentControlOptions,
};
