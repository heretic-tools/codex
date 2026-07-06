import {
  createAttachmentControlSelects,
  refreshAttachmentControlSelects,
} from "./builder_roster_attachment_control_selects.js";
import { button, textNode } from "./builder_dom.js";
import { ADD_ATTACHED_UNIT_LABEL, labelControl } from "./builder_roster_control_labels.js";
import { rosterWithAddedAttachment } from "./builder_roster_actions.js";

function attachmentControlField(label, control) {
  const field = document.createElement("label");
  field.className = "field attachment-control-field";
  field.append(textNode("span", "", label), control);
  return field;
}

function renderAttachmentControls({ bodyguards, newId, onUpdate, roster, units, unitsById }) {
  const { attached, bodyguard, type } = createAttachmentControlSelects();
  const controls = document.createElement("div");
  controls.className = "builder-control-row attachment-control-row";

  const add = button("plain-button add-button", "Add", async () => {
    await onUpdate(rosterWithAddedAttachment(roster, {
      attachedUnitId: attached.value,
      attachmentId: newId(),
      attachmentType: type.value,
      bodyguardUnitId: bodyguard.value,
      units,
    }));
  });
  labelControl(add, ADD_ATTACHED_UNIT_LABEL);

  const refreshControls = () => {
    refreshAttachmentControlSelects({
      add,
      attached,
      bodyguard,
      bodyguards,
      controls,
      roster,
      type,
      units,
      unitsById,
    });
  };

  controls.append(
    attachmentControlField("Bodyguard", bodyguard),
    attachmentControlField("Role", type),
    attachmentControlField("Attached Unit", attached),
    add
  );
  bodyguard.addEventListener("change", refreshControls);
  type.addEventListener("change", refreshControls);
  refreshControls();
  return controls;
}

export { attachmentControlField, renderAttachmentControls };
