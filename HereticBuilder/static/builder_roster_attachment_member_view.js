import { button, textNode } from "./builder_dom.js";
import { attachmentTypeLabel } from "./builder_roster_attachment_options.js";
import { rosterWithRemovedAttachmentMember } from "./builder_roster_actions.js";
import { attachmentTitle } from "./builder_roster_attachment_row_model.js";
import { removeButton } from "./builder_roster_editor_dom.js";
import { labelControl } from "./builder_roster_control_labels.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { unitImageNode } from "./builder_unit_images.js";
import { unitOpenLabel } from "./builder_unit_open_labels.js";

function removeAttachmentMemberFromRow(roster, attachment, member, unit, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: `${unit.name || "Unit"} removed from attached unit`,
    nextRoster: rosterWithRemovedAttachmentMember(roster, attachment.id, member.rosterUnitId),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function renderAttachmentMember(
  roster,
  attachment,
  member,
  unit,
  onUpdate,
  onUnitOpen = null,
  onUndoableUpdate = null
) {
  const node = document.createElement("span");
  node.className = "attachment-member";
  const unitName = onUnitOpen
    ? labelControl(button("attachment-unit-link", unit.name || "Unit", () => onUnitOpen(unit)), unitOpenLabel(unit))
    : textNode("span", "", unit.name || "Unit");
  const image = unitImageNode(unit.datasheetId, "attachment-unit-art-frame");
  if (image) {
    node.appendChild(image);
  }
  node.append(
    textNode("span", member.attachmentType === "bodyguard" ? "meta-badge" : "", attachmentTypeLabel(member.attachmentType)),
    unitName,
    removeButton(`Remove ${unit.name || "unit"} from attached unit`, async () => (
      removeAttachmentMemberFromRow(roster, attachment, member, unit, onUpdate, onUndoableUpdate)
    ))
  );
  return node;
}

function attachmentTitleNode(members, index, onUnitOpen) {
  const bodyguards = members.filter((member) => member.attachmentType === "bodyguard");
  if (bodyguards.length === 1 && onUnitOpen) {
    const unit = bodyguards[0].unit;
    return labelControl(
      button("attachment-title-button", unit.name || "Bodyguard", () => onUnitOpen(unit)),
      unitOpenLabel(unit)
    );
  }
  return textNode("strong", "", attachmentTitle(members, index));
}

export { attachmentTitleNode, removeAttachmentMemberFromRow, renderAttachmentMember };
