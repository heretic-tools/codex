import {
  ATTACHED_UNIT_SELECT_LABEL,
  ATTACHMENT_BODYGUARD_SELECT_LABEL,
  ATTACHMENT_TYPE_SELECT_LABEL,
  labelControl,
} from "./builder_roster_control_labels.js";

function createAttachmentControlSelects() {
  const bodyguard = document.createElement("select");
  bodyguard.dataset.focusTarget = "true";
  labelControl(bodyguard, ATTACHMENT_BODYGUARD_SELECT_LABEL);
  const type = labelControl(document.createElement("select"), ATTACHMENT_TYPE_SELECT_LABEL);
  const attached = labelControl(document.createElement("select"), ATTACHED_UNIT_SELECT_LABEL);
  return {
    attached,
    bodyguard,
    type,
  };
}

export { createAttachmentControlSelects };
