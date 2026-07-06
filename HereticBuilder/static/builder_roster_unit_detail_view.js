import { unitSummary } from "./builder_model.js";
import { validationContextForRoster } from "./builder_validation_context.js";
import { renderValidation, validationForUnit } from "./builder_validation_view.js";
import {
  renderUnitValidationAction,
  scrollToUnitDetailTarget,
  unitValidationActionTarget,
} from "./builder_roster_unit_detail_actions.js";
import { renderEnhancementsEditor } from "./builder_roster_unit_detail_editors.js";
import { renderRosterStickySummary } from "./builder_roster_overview_view.js";
import { renderRosterUnitOverview, unitDisplayName } from "./builder_roster_unit_overview_view.js";
import { renderRosterUnitWargearSection } from "./builder_roster_unit_wargear_section_view.js";

function validationWithoutMessages(validation, excludedMessages) {
  const excluded = new Set(excludedMessages || []);
  const messages = (validation.messages || []).filter((message) => !excluded.has(message));
  return {
    ...validation,
    messages,
    state: messages.some((message) => message.level === "error") ? "invalid" : "valid",
  };
}

function renderRosterUnitDetailView({ focusTarget = "", onBack, onUndoableUpdate = null, onUpdate, roster, unit, validation }) {
  const summary = unitSummary(roster, unit);
  const unitValidation = validationForUnit(validation, summary);
  const otherValidation = validationWithoutMessages(validation, unitValidation.messages);
  const validationContext = validationContextForRoster(roster);
  const otherIssueCount = otherValidation.messages.length;
  const root = document.createElement("section");
  root.className = "builder-grid unit-detail-grid";
  const stickySummary = renderRosterStickySummary({ roster, validation });

  const sidebar = document.createElement("section");
  sidebar.className = "builder-roster-sidebar";

  const overview = renderRosterUnitOverview({
    onBack,
    onUndoableUpdate,
    onUpdate,
    roster,
    unit: summary,
    validation: unitValidation,
    validationContext,
  });
  const wargear = renderRosterUnitWargearSection({
    onUndoableUpdate,
    onUpdate,
    roster,
    unit: summary,
    validation: unitValidation,
    validationContext,
  });

  sidebar.append(
    overview,
    renderValidation(unitValidation, {
      context: validationContext,
      groupAction: renderUnitValidationAction,
      title: "Unit Validation",
    })
  );
  if (otherIssueCount) {
    sidebar.appendChild(renderValidation(otherValidation, {
      context: validationContext,
      groupAction: renderUnitValidationAction,
      title: "Roster Issues",
    }));
  }
  sidebar.appendChild(renderEnhancementsEditor({
    onUpdate,
    roster,
    unit: summary,
    validation: unitValidation,
    validationContext,
  }));
  root.append(stickySummary, sidebar, wargear);
  if (focusTarget) {
    window.requestAnimationFrame(() => scrollToUnitDetailTarget(focusTarget));
  }
  return root;
}

export {
  renderRosterUnitDetailView,
  unitDisplayName,
  unitValidationActionTarget,
  validationWithoutMessages,
};
