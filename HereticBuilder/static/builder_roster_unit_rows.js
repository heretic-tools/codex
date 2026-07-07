import { button, textNode } from "./builder_dom.js";
import { rosterWithRemovedUnit } from "./builder_roster_actions.js";
import { removeButton } from "./builder_roster_editor_dom.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { unitSourceBadgeNode, unitSourceBadgeText } from "./builder_roster_unit_badges.js";
import { unitValidationStatus } from "./builder_roster_unit_validation_status.js";
import { unitRowSummaryText } from "./builder_roster_unit_row_summary.js";
import { enableSwipeAction } from "./builder_swipe_action.js";
import { unitImageNode } from "./builder_unit_images.js";
import { unitOpenLabel } from "./builder_unit_open_labels.js";

function removeUnitFromRow(roster, summary, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: `${summary.name || "Unit"} removed`,
    nextRoster: rosterWithRemovedUnit(roster, summary.id),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function unitModelCountLabel(count) {
  return `${count} ${count === 1 ? "model" : "models"}`;
}

function renderUnitRow(roster, summary, validation, onUpdate, onUnitOpen, onUndoableUpdate = null) {
  const row = document.createElement("div");
  row.className = "builder-row editor-row unit-editor-row";
  const removeUnit = () => removeUnitFromRow(roster, summary, onUpdate, onUndoableUpdate);
  enableSwipeAction(row, removeUnit);
  const validationStatus = unitValidationStatus(validation, summary);
  if (validationStatus) {
    row.classList.add(`has-validation-${validationStatus.className}`);
  }
  const text = button("unit-open-button", "", () => onUnitOpen(summary));
  text.className = "unit-open-button row-text";
  const sourceLabel = unitSourceBadgeText(summary);
  const summaryText = unitRowSummaryText(summary);
  const openLabel = unitOpenLabel(summary, { sourceLabel, summaryText });
  text.title = openLabel;
  text.setAttribute("aria-label", openLabel);
  const image = unitImageNode(summary.datasheetId);
  if (image) {
    text.appendChild(image);
  }
  text.append(
    textNode("strong", "", summary.name || "Unit"),
    textNode("span", "", unitModelCountLabel(summary.modelCount || 0))
  );
  if (summaryText) {
    text.append(textNode("span", "unit-row-summary", summaryText));
  }
  if (summary.isWarlord) {
    text.append(textNode("span", "meta-badge", "Warlord"));
  }
  const sourceBadge = sourceLabel ? unitSourceBadgeNode(summary) : null;
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
    removeButton("Remove unit", removeUnit)
  );
  row.append(text, meta);
  return row;
}

export {
  removeUnitFromRow,
  renderUnitRow,
  unitModelCountLabel,
  unitOpenLabel,
  unitSourceBadgeText,
};
