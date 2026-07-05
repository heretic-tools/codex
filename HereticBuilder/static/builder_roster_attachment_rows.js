import { button, textNode } from "./builder_dom.js";
import { attachmentTypeLabel } from "./builder_roster_attachment_options.js";
import {
  rosterWithRemovedAttachment,
  rosterWithRemovedAttachmentMember,
} from "./builder_roster_actions.js";
import { removeButton } from "./builder_roster_editor_dom.js";
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

export { renderAttachmentRow };
