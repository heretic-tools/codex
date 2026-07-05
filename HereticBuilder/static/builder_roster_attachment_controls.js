import { button, option } from "./builder_dom.js";
import {
  ATTACHMENT_TYPES,
  attachableUnits,
  availableAttachmentTypes,
  unitLabel,
} from "./builder_roster_attachment_options.js";
import { rosterWithAddedAttachment } from "./builder_roster_actions.js";

function renderAttachmentControls({ bodyguards, newId, onUpdate, roster, units, unitsById }) {
  const bodyguard = document.createElement("select");
  bodyguard.dataset.focusTarget = "true";
  const type = document.createElement("select");
  const attached = document.createElement("select");
  const controls = document.createElement("div");
  controls.className = "builder-control-row attachment-control-row";

  const add = button("plain-button add-button", "Add", async () => {
    await onUpdate(rosterWithAddedAttachment(roster, {
      attachedUnitId: attached.value,
      attachmentId: newId(),
      attachmentType: type.value,
      bodyguardUnitId: bodyguard.value,
    }));
  });

  const refreshControls = () => {
    if (!bodyguards.length) {
      bodyguard.replaceChildren(option("", "Bodyguard: none available"));
      type.replaceChildren(option("", "Attach as: none available"));
      attached.replaceChildren(option("", "Unit: none available"));
      bodyguard.disabled = true;
      type.disabled = true;
      attached.disabled = true;
      add.disabled = true;
      controls.hidden = true;
      return;
    }

    const previousBodyguard = bodyguard.value;
    bodyguard.replaceChildren(...bodyguards.map((unit) => option(unit.id, unitLabel(unit, "Bodyguard", units))));
    bodyguard.value = bodyguards.some((unit) => unit.id === previousBodyguard)
      ? previousBodyguard
      : bodyguards[0]?.id || "";

    const selectedBodyguard = unitsById.get(bodyguard.value);
    const typeRows = selectedBodyguard ? availableAttachmentTypes(roster, units, selectedBodyguard) : [];
    const previousType = type.value;
    type.replaceChildren(...typeRows.map((item) => option(item.value, `Attach as: ${item.label}`)));
    type.value = typeRows.some((item) => item.value === previousType)
      ? previousType
      : typeRows[0]?.value || "";

    const selectedType = ATTACHMENT_TYPES.find((item) => item.value === type.value);
    const attachedRows = selectedBodyguard
      ? attachableUnits(roster, units, selectedBodyguard, type.value)
      : [];
    const previousAttached = attached.value;
    attached.replaceChildren(...attachedRows.map((unit) => option(unit.id, unitLabel(unit, selectedType?.label || "Unit", units))));
    attached.value = attachedRows.some((unit) => unit.id === previousAttached)
      ? previousAttached
      : attachedRows[0]?.id || "";

    bodyguard.disabled = false;
    type.disabled = !typeRows.length;
    attached.disabled = !attachedRows.length;
    add.disabled = !bodyguard.value || !attached.value;
    controls.hidden = false;
  };

  controls.append(bodyguard, type, attached, add);
  bodyguard.addEventListener("change", refreshControls);
  type.addEventListener("change", refreshControls);
  refreshControls();
  return controls;
}

export { renderAttachmentControls };
