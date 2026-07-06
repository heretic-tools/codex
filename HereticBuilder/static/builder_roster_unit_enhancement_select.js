import { option, textNode } from "./builder_dom.js";
import { enhancementLabel } from "./builder_roster_unit_enhancement_labels.js";
import { enhancementSelectRows } from "./builder_roster_unit_enhancement_options.js";
import { renderUnitEditorValidation } from "./builder_roster_unit_editor_validation_view.js";

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
  select.appendChild(option("", "No enhancement"));
  for (const row of enhancementSelectRows({ currentId, enhancements, keywordIds, miniature, roster, targetKind, unit, units })) {
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
  if (targetId) {
    const validationNode = renderUnitEditorValidation(validation, validationContext, "enhancements", targetId);
    if (validationNode) {
      wrap.appendChild(validationNode);
    }
  }
  return wrap;
}

export { renderEnhancementSelect };
