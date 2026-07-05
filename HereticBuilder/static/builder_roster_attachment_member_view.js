import { button, textNode } from "./builder_dom.js";
import { attachmentTypeLabel } from "./builder_roster_attachment_options.js";
import { rosterWithRemovedAttachmentMember } from "./builder_roster_actions.js";
import { attachmentTitle } from "./builder_roster_attachment_row_model.js";
import { removeButton } from "./builder_roster_editor_dom.js";
import { unitImageNode } from "./builder_unit_images.js";

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

function attachmentTitleNode(members, index, onUnitOpen) {
  const bodyguards = members.filter((member) => member.attachmentType === "bodyguard");
  if (bodyguards.length === 1 && onUnitOpen) {
    return button("attachment-title-button", bodyguards[0].unit.name || "Bodyguard", () => onUnitOpen(bodyguards[0].unit));
  }
  return textNode("strong", "", attachmentTitle(members, index));
}

export { attachmentTitleNode, renderAttachmentMember };
