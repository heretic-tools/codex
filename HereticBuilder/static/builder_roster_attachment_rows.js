import { textNode } from "./builder_dom.js";
import {
  rosterWithRemovedAttachment,
} from "./builder_roster_actions.js";
import {
  attachmentMembersForRow,
  attachmentValidationStatus,
} from "./builder_roster_attachment_row_model.js";
import { attachmentTitleNode, renderAttachmentMember } from "./builder_roster_attachment_member_view.js";
import { removeButton } from "./builder_roster_editor_dom.js";
import { unitImageNode } from "./builder_unit_images.js";

function renderAttachmentRow(roster, attachment, index, unitsById, validation, onUpdate, onUnitOpen = null) {
  const members = attachmentMembersForRow(attachment, unitsById);

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
