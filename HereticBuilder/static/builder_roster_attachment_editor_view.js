import { button, option, textNode } from "./builder_dom.js";
import { rosterUnitSummaries } from "./builder_model.js";
import {
  ATTACHMENT_TYPES,
  attachableUnits,
  attachmentTypeLabel,
  attachmentUnavailableMessage,
  availableAttachmentTypes,
  bodyguardRows,
  unitLabel,
} from "./builder_roster_attachment_options.js";
import {
  rosterWithAddedAttachment,
  rosterWithRemovedAttachment,
  rosterWithRemovedAttachmentMember,
} from "./builder_roster_actions.js";
import {
  emptyMessage,
  removeButton,
  sectionTitle,
} from "./builder_roster_editor_dom.js";
import { unitImageNode } from "./builder_unit_images.js";
import { validationForAttachment } from "./builder_validation_view.js";

function renderAttachmentMember(roster, attachment, member, unit, onUpdate, onUnitOpen = null) {
  const node = document.createElement("span");
  node.className = "attachment-member";
  const unitName = onUnitOpen
    ? button("attachment-unit-link", unit.name || "Unit", () => onUnitOpen(unit))
    : textNode("span", "", unit.name || "Unit");
  const image = unitImageNode(unit.datasheetId, "attachment-unit-art-frame");
  if (image) {
    node.appendChild(image);
  }
  node.append(
    textNode("span", member.attachmentType === "bodyguard" ? "meta-badge" : "", attachmentTypeLabel(member.attachmentType)),
    unitName,
    removeButton(`Remove ${unit.name || "unit"} from attached unit`, async () => (
      onUpdate(rosterWithRemovedAttachmentMember(roster, attachment.id, member.rosterUnitId))
    ))
  );
  return node;
}

function attachmentValidationStatus(validation, attachment, unitsById) {
  const messages = validationForAttachment(validation, attachment, unitsById).messages || [];
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

function attachmentTitle(members, index) {
  const bodyguardNames = members
    .filter((member) => member.attachmentType === "bodyguard")
    .map((member) => member.unit.name || "Bodyguard");
  return bodyguardNames.length ? bodyguardNames.join(" + ") : `Attached Unit ${index + 1}`;
}

function attachmentTitleNode(members, index, onUnitOpen) {
  const bodyguards = members.filter((member) => member.attachmentType === "bodyguard");
  if (bodyguards.length === 1 && onUnitOpen) {
    return button("attachment-title-button", bodyguards[0].unit.name || "Bodyguard", () => onUnitOpen(bodyguards[0].unit));
  }
  return textNode("strong", "", attachmentTitle(members, index));
}

function renderAttachmentRow(roster, attachment, index, unitsById, validation, onUpdate, onUnitOpen = null) {
  const members = [
    ...(attachment.members || []).filter((member) => member.attachmentType === "bodyguard"),
    ...(attachment.members || []).filter((member) => member.attachmentType === "leader" || member.attachmentType === "support"),
  ]
    .map((member) => ({
      ...member,
      unit: unitsById.get(member.rosterUnitId),
    }))
    .filter((member) => member.unit);

  const row = document.createElement("div");
  row.className = "builder-row editor-row attachment-editor-row";
  row.dataset.attachmentId = attachment.id;
  const validationStatus = attachmentValidationStatus(validation, attachment, unitsById);
  if (validationStatus) {
    row.classList.add(`has-validation-${validationStatus.className}`);
  }
  const text = document.createElement("span");
  text.className = "row-text";
  const bodyguard = members.find((member) => member.attachmentType === "bodyguard");
  const image = bodyguard ? unitImageNode(bodyguard.unit.datasheetId, "attachment-title-art-frame") : null;
  if (image) {
    text.appendChild(image);
  }
  text.append(attachmentTitleNode(members, index, onUnitOpen));
  for (const member of members) {
    if (member.attachmentType === "bodyguard") {
      continue;
    }
    text.append(renderAttachmentMember(roster, attachment, member, member.unit, onUpdate, onUnitOpen));
  }
  if (validationStatus) {
    text.append(textNode("span", `validation-state-badge state-${validationStatus.className}`, validationStatus.text));
  }
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", "", `${attachment.members?.length || 0} units`),
    removeButton("Remove attached unit", async () => onUpdate(rosterWithRemovedAttachment(roster, attachment.id)))
  );
  row.append(text, meta);
  return row;
}

function renderAttachmentEditor({ newId, onUnitOpen, onUpdate, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.dataset.editorTarget = "attachments";
  root.append(sectionTitle(`Attached Units (${(roster.attachments || []).length})`));

  const units = rosterUnitSummaries(roster);
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const bodyguards = bodyguardRows(roster, units);
  const bodyguard = document.createElement("select");
  bodyguard.dataset.focusTarget = "true";
  const type = document.createElement("select");
  const attached = document.createElement("select");

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

  const list = document.createElement("div");
  list.className = "editor-list";
  if ((roster.attachments || []).length) {
    (roster.attachments || []).forEach((attachment, index) => {
      list.appendChild(renderAttachmentRow(roster, attachment, index, unitsById, validation, onUpdate, onUnitOpen));
    });
  } else {
    list.appendChild(emptyMessage(attachmentUnavailableMessage(roster, units, bodyguards)));
  }
  root.appendChild(list);

  const controls = document.createElement("div");
  controls.className = "builder-control-row attachment-control-row";
  controls.append(bodyguard, type, attached, add);
  bodyguard.addEventListener("change", refreshControls);
  type.addEventListener("change", refreshControls);
  refreshControls();
  root.appendChild(controls);
  return root;
}

export { attachmentUnavailableMessage, renderAttachmentEditor };
