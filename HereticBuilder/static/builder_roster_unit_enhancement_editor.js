import { textNode } from "./builder_dom.js";
import { rosterUnitSummaries } from "./builder_model.js";
import {
  rosterWithMiniatureEnhancement,
  rosterWithUnitEnhancement,
} from "./builder_roster_actions.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { renderUnitEditorValidation } from "./builder_roster_unit_editor_validation_view.js";
import { enhancementSelectModels } from "./builder_roster_unit_enhancement_models.js";
import { enhancementSelectHasActionableRows } from "./builder_roster_unit_enhancement_options.js";
import { renderEnhancementSelect } from "./builder_roster_unit_enhancement_select.js";
import { state } from "./builder_state.js";

function enhancementChangeMessage(unit) {
  return `Enhancement changed for ${unit.name || "Unit"}`;
}

function rosterWithEnhancementFromEditor(roster, unit, model, enhancementId, context) {
  return model.targetKind === "unit"
    ? rosterWithUnitEnhancement(roster, unit.id, enhancementId, context)
    : rosterWithMiniatureEnhancement(roster, unit.id, {
      enhancementId,
      ...context,
      rosterUnitMiniatureId: model.targetId,
    });
}

function updateEnhancementFromEditor(roster, unit, model, enhancementId, context, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: enhancementChangeMessage(unit),
    nextRoster: rosterWithEnhancementFromEditor(roster, unit, model, enhancementId, context),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function renderEnhancementsEditor({
  onUndoableUpdate = null,
  onUpdate,
  roster,
  unit,
  validation = null,
  validationContext = {},
}) {
  const sectionValidation = renderUnitEditorValidation(validation, validationContext, "enhancements");
  const selectModels = enhancementSelectModels(roster, unit);
  const units = rosterUnitSummaries(roster);
  const actionableModels = selectModels.filter((model) => enhancementSelectHasActionableRows({
    ...model,
    miniature: model.miniature || null,
    roster,
    unit,
    units,
  }));
  if (!actionableModels.length && !sectionValidation) {
    return null;
  }

  const wrap = document.createElement("section");
  wrap.className = "builder-section unit-enhancements-section";
  wrap.dataset.unitDetailTarget = "enhancements";
  wrap.appendChild(textNode("h2", "section-title", "Enhancements"));
  if (sectionValidation) {
    wrap.appendChild(sectionValidation);
  }

  const detachments = (roster.detachmentIds || [])
    .map((id) => state.catalog.detachmentById.get(id))
    .filter(Boolean);
  if (!actionableModels.length) {
    wrap.appendChild(textNode("p", "empty-list", "No enhancements available for selected detachments"));
    return wrap;
  }

  for (const model of actionableModels) {
    const context = {
      detachments,
      keywordIds: model.keywordIds,
      miniature: model.miniature || null,
      unit,
      units,
    };
    wrap.appendChild(renderEnhancementSelect({
      ...model,
      onChange: async (enhancementId) => updateEnhancementFromEditor(
        roster,
        unit,
        model,
        enhancementId,
        context,
        onUpdate,
        onUndoableUpdate
      ),
      roster,
      unit,
      units,
      validation,
      validationContext,
    }));
  }
  return wrap;
}

export {
  enhancementChangeMessage,
  renderEnhancementsEditor,
  rosterWithEnhancementFromEditor,
  updateEnhancementFromEditor,
};
