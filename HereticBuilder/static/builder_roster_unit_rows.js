import { button, textNode } from "./builder_dom.js";
import { rosterWithRemovedUnit } from "./builder_roster_actions.js";
import { removeButton } from "./builder_roster_editor_dom.js";
import { unitSourceBadgeNode, unitSourceBadgeText } from "./builder_roster_unit_badges.js";
import { unitValidationStatus } from "./builder_roster_unit_validation_status.js";
import { unitImageNode } from "./builder_unit_images.js";
import { unitOpenLabel } from "./builder_unit_open_labels.js";

function renderUnitRow(roster, summary, validation, onUpdate, onUnitOpen) {
  const row = document.createElement("div");
  row.className = "builder-row editor-row unit-editor-row";
  const validationStatus = unitValidationStatus(validation, summary);
  if (validationStatus) {
    row.classList.add(`has-validation-${validationStatus.className}`);
  }
  const text = button("unit-open-button", "", () => onUnitOpen(summary));
  text.className = "unit-open-button row-text";
  const openLabel = unitOpenLabel(summary);
  text.title = openLabel;
  text.setAttribute("aria-label", openLabel);
  const image = unitImageNode(summary.datasheetId);
  if (image) {
    text.appendChild(image);
  }
  text.append(
    textNode("strong", "", summary.name || "Unit"),
    textNode("span", "", `${summary.modelCount || 0} models`)
  );
  if (summary.isWarlord) {
    text.append(textNode("span", "meta-badge", "Warlord"));
  }
  const sourceBadge = unitSourceBadgeNode(summary);
  if (sourceBadge) {
    text.append(sourceBadge);
  }
  if (validationStatus) {
    text.append(textNode("span", `validation-state-badge state-${validationStatus.className}`, validationStatus.text));
  }
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", "", `${summary.points || 0} pts`),
    removeButton("Remove unit", async () => onUpdate(rosterWithRemovedUnit(roster, summary.id)))
  );
  row.append(text, meta);
  return row;
}

export {
  renderUnitRow,
  unitOpenLabel,
  unitSourceBadgeText,
};
