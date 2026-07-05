import { textNode } from "./builder_dom.js";
import { rosterUnitSummaries } from "./builder_model.js";
import {
  rosterWithMiniatureEnhancement,
  rosterWithUnitEnhancement,
} from "./builder_roster_actions.js";
import {
  currentMiniatureEnhancementId,
  enhancementOptionsFor,
  miniatureEnhancementKeywordIds,
} from "./builder_roster_unit_enhancement_options.js";
import { renderEnhancementSelect } from "./builder_roster_unit_enhancement_select.js";

function renderEnhancementsEditor({ onUpdate, roster, unit }) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section unit-enhancements-section";
  wrap.dataset.unitDetailTarget = "enhancements";
  wrap.appendChild(textNode("h2", "section-title", "Enhancements"));

  const units = rosterUnitSummaries(roster);
  const currentUnitEnhancementId = unit.unitEnhancements?.[0]?.id || "";
  const unitOptions = enhancementOptionsFor(roster, "unit", currentUnitEnhancementId);
  const miniatureTargets = unit.miniatures || [];
  const hasOptions = unitOptions.length || miniatureTargets.some((miniature) => (
    enhancementOptionsFor(roster, "miniature", currentMiniatureEnhancementId(unit, miniature.rosterUnitMiniatureId || miniature.id)).length
  ));
  if (!hasOptions) {
    wrap.appendChild(textNode("p", "empty-list", "No enhancements available for selected detachments"));
    return wrap;
  }

  if (unitOptions.length || currentUnitEnhancementId) {
    wrap.appendChild(renderEnhancementSelect({
      currentId: currentUnitEnhancementId,
      enhancements: unitOptions,
      keywordIds: unit.keywordIds || [],
      label: "Unit",
      onChange: async (enhancementId) => onUpdate(rosterWithUnitEnhancement(roster, unit.id, enhancementId)),
      roster,
      targetKind: "unit",
      unit,
      units,
    }));
  }

  for (const miniature of miniatureTargets) {
    const targetId = miniature.rosterUnitMiniatureId || miniature.id;
    const currentId = currentMiniatureEnhancementId(unit, targetId);
    const options = enhancementOptionsFor(roster, "miniature", currentId);
    if (!options.length && !currentId) {
      continue;
    }
    wrap.appendChild(renderEnhancementSelect({
      currentId,
      enhancements: options,
      keywordIds: miniatureEnhancementKeywordIds(unit, miniature),
      label: `${miniature.name} (${miniature.count || 0})`,
      miniature,
      onChange: async (enhancementId) => onUpdate(rosterWithMiniatureEnhancement(roster, unit.id, {
        enhancementId,
        rosterUnitMiniatureId: targetId,
      })),
      roster,
      targetKind: "miniature",
      unit,
      units,
    }));
  }
  return wrap;
}

export { renderEnhancementsEditor };
