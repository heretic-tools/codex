import { option, textNode } from "./builder_dom.js";
import { labelControl } from "./builder_roster_control_labels.js";
import {
  controlAvailabilitySummary,
  safeDomId,
} from "./builder_roster_control_availability.js";
import {
  enhancementKindLabel,
  enhancementLabel,
} from "./builder_roster_unit_enhancement_labels.js";
import { enhancementSelectRows } from "./builder_roster_unit_enhancement_options.js";
import { renderUnitEditorValidation } from "./builder_roster_unit_editor_validation_view.js";

function enhancementAvailabilitySummary(rows = []) {
  return controlAvailabilitySummary(rows);
}

function renderEnhancementSelect({
  currentId,
  enhancements,
  keywordIds,
  label,
  miniature = null,
  onChange,
  roster,
  targetKind,
  unit,
  units,
  validation = null,
  validationContext = {},
}) {
  const select = document.createElement("select");
  const kindLabel = enhancementKindLabel(enhancements);
  const rows = enhancementSelectRows({ currentId, enhancements, keywordIds, miniature, roster, targetKind, unit, units });
  labelControl(select, `Choose ${kindLabel} for ${label || unit?.name || "unit"}`);
  select.appendChild(option("", `No ${kindLabel}`));
  for (const row of rows) {
    select.appendChild(option(
      row.enhancement.id,
      enhancementLabel(row.enhancement, keywordIds, row.status),
      { disabled: row.disabled }
    ));
  }
  select.value = currentId || "";
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => onChange(select.value));

  const wrap = document.createElement("label");
  wrap.className = "field enhancement-field";
  const targetId = miniature?.rosterUnitMiniatureId || miniature?.id || "";
  if (targetId) {
    wrap.dataset.unitDetailTarget = `enhancement:${targetId}`;
  }
  wrap.append(textNode("span", "", label), select);
  const availabilityText = enhancementAvailabilitySummary(rows);
  if (availabilityText) {
    const availability = textNode("span", "field-status enhancement-availability-status", availabilityText);
    availability.id = `enhancement-availability-${safeDomId(unit?.id)}-${safeDomId(targetId || targetKind)}`;
    select.setAttribute("aria-describedby", availability.id);
    wrap.appendChild(availability);
  }
  if (targetId) {
    const validationNode = renderUnitEditorValidation(validation, validationContext, "enhancements", targetId);
    if (validationNode) {
      wrap.appendChild(validationNode);
    }
  }
  return wrap;
}

export { enhancementAvailabilitySummary, renderEnhancementSelect };
