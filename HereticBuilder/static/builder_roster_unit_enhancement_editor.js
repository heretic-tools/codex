import { textNode } from "./builder_dom.js";
import { rosterUnitSummaries } from "./builder_model.js";
import {
  rosterWithMiniatureEnhancement,
  rosterWithUnitEnhancement,
} from "./builder_roster_actions.js";
import { enhancementSelectModels } from "./builder_roster_unit_enhancement_models.js";
import { renderEnhancementSelect } from "./builder_roster_unit_enhancement_select.js";
import { state } from "./builder_state.js";

function renderEnhancementsEditor({ onUpdate, roster, unit }) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section unit-enhancements-section";
  wrap.dataset.unitDetailTarget = "enhancements";
  wrap.appendChild(textNode("h2", "section-title", "Enhancements"));

  const units = rosterUnitSummaries(roster);
  const detachments = (roster.detachmentIds || [])
    .map((id) => state.catalog.detachmentById.get(id))
    .filter(Boolean);
  const selectModels = enhancementSelectModels(roster, unit);
  if (!selectModels.length) {
    wrap.appendChild(textNode("p", "empty-list", "No enhancements available for selected detachments"));
    return wrap;
  }

  for (const model of selectModels) {
    const context = {
      detachments,
      keywordIds: model.keywordIds,
      miniature: model.miniature || null,
      unit,
      units,
    };
    wrap.appendChild(renderEnhancementSelect({
      ...model,
      onChange: async (enhancementId) => onUpdate(model.targetKind === "unit"
        ? rosterWithUnitEnhancement(roster, unit.id, enhancementId, context)
        : rosterWithMiniatureEnhancement(roster, unit.id, {
          enhancementId,
          ...context,
          rosterUnitMiniatureId: model.targetId,
        })),
      roster,
      unit,
      units,
    }));
  }
  return wrap;
}

export { renderEnhancementsEditor };
