import { button, textNode } from "./builder_dom.js";
import { alliedFactionName } from "./builder_model.js";
import { rosterWithRemovedUnit } from "./builder_roster_actions.js";
import { removeButton } from "./builder_roster_editor_dom.js";
import { unitImageNode } from "./builder_unit_images.js";
import { validationForUnit } from "./builder_validation_view.js";

function compactBadgeLabel(value, maxLength = 28) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function unitSourceBadgeText(unit) {
  const allyType = unit.allyType || "native";
  if (allyType === "native") {
    return "";
  }
  return `Allied: ${compactBadgeLabel(alliedFactionName(allyType))}`;
}

function unitSourceBadgeNode(unit) {
  const text = unitSourceBadgeText(unit);
  if (!text) {
    return null;
  }
  const badge = textNode("span", "meta-badge", text);
  badge.title = `Allied: ${alliedFactionName(unit.allyType)}`;
  return badge;
}

function unitValidationStatus(validation, summary) {
  const messages = validationForUnit(validation, summary).messages || [];
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

function renderUnitRow(roster, summary, validation, onUpdate, onUnitOpen) {
  const row = document.createElement("div");
  row.className = "builder-row editor-row unit-editor-row";
  const validationStatus = unitValidationStatus(validation, summary);
  if (validationStatus) {
    row.classList.add(`has-validation-${validationStatus.className}`);
  }
  const text = button("unit-open-button", "", () => onUnitOpen(summary));
  text.className = "unit-open-button row-text";
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
  unitSourceBadgeText,
};
