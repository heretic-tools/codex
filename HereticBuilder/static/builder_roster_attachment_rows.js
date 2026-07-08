import { textNode } from "./builder_dom.js";
import {
  rosterWithRemovedAttachment,
} from "./builder_roster_actions.js";
import {
  attachmentMembersForRow,
  attachmentTitle,
  attachmentValidationStatus,
} from "./builder_roster_attachment_row_model.js";
import { attachmentTitleNode, renderAttachmentMember } from "./builder_roster_attachment_member_view.js";
import { removeButton } from "./builder_roster_editor_dom.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { applyUnitBackgroundArt } from "./builder_unit_images.js";

function removeAttachmentFromRow(roster, attachment, members, index, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: `${attachmentTitle(members, index)} removed`,
    nextRoster: rosterWithRemovedAttachment(roster, attachment.id),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function attachmentMemberCountLabel(count) {
  return `${count} ${count === 1 ? "unit" : "units"}`;
}

function renderAttachmentRow(
  roster,
  attachment,
  index,
  unitsById,
  validation,
  onUpdate,
  onUnitOpen = null,
  onUndoableUpdate = null
) {
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
  if (bodyguard) {
    applyUnitBackgroundArt(row, bodyguard.unit.datasheetId);
  }
  text.append(attachmentTitleNode(members, index, onUnitOpen));
  for (const member of members) {
    if (member.attachmentType === "bodyguard") {
      continue;
    }
    text.append(renderAttachmentMember(roster, attachment, member, member.unit, onUpdate, onUnitOpen, onUndoableUpdate));
  }
  if (validationStatus) {
    text.append(textNode("span", `validation-state-badge state-${validationStatus.className}`, validationStatus.text));
  }
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", "", attachmentMemberCountLabel(attachment.members?.length || 0)),
    removeButton("Remove attached unit", async () => (
      removeAttachmentFromRow(roster, attachment, members, index, onUpdate, onUndoableUpdate)
    ))
  );
  row.append(text, meta);
  return row;
}

export { attachmentMemberCountLabel, removeAttachmentFromRow, renderAttachmentRow };
