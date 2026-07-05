import { option, textNode } from "./builder_dom.js";
import { enhancementCandidateStatus } from "./builder_enhancement_rules.js";
import { enhancementLabel } from "./builder_roster_unit_enhancement_options.js";
import { state } from "./builder_state.js";

function enhancementSelectRows({ enhancements, keywordIds, miniature, roster, targetKind, unit, units }) {
  const detachments = (roster.detachmentIds || []).map((id) => ({ id, ...state.catalog.detachmentById.get(id) }));
  return enhancements.map((enhancement, index) => ({
    enhancement,
    index,
    status: enhancementCandidateStatus({
      roster,
      detachments,
      units,
      unit,
      enhancement,
      keywordIds,
      miniature,
      targetKind,
    }),
  })).sort((left, right) => Number(right.status.eligible) - Number(left.status.eligible) || left.index - right.index);
}

function renderEnhancementSelect({ currentId, enhancements, keywordIds, label, miniature = null, onChange, roster, targetKind, unit, units }) {
  const select = document.createElement("select");
  select.appendChild(option("", "No enhancement"));
  for (const row of enhancementSelectRows({ enhancements, keywordIds, miniature, roster, targetKind, unit, units })) {
    select.appendChild(option(row.enhancement.id, enhancementLabel(row.enhancement, keywordIds, row.status)));
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
  return wrap;
}

export { renderEnhancementSelect };
