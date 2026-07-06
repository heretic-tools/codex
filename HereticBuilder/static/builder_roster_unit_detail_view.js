import { unitSummary } from "./builder_model.js";
import { validationContextForRoster } from "./builder_validation_context.js";
import { renderValidation, validationForUnit } from "./builder_validation_view.js";
import { renderUnitValidationAction, unitValidationActionTarget } from "./builder_roster_unit_detail_actions.js";
import { renderEnhancementsEditor } from "./builder_roster_unit_detail_editors.js";
import { renderRosterUnitOverview, unitDisplayName } from "./builder_roster_unit_overview_view.js";
import { renderRosterUnitWargearSection } from "./builder_roster_unit_wargear_section_view.js";

function renderRosterUnitDetailView({ onBack, onUpdate, roster, unit, validation }) {
  const summary = unitSummary(roster, unit);
  const unitValidation = validationForUnit(validation, summary);
  const validationContext = validationContextForRoster(roster);
  const otherIssueCount = Math.max(0, (validation.messages || []).length - unitValidation.messages.length);
  const root = document.createElement("section");
  root.className = "builder-grid";

  const sidebar = document.createElement("section");
  sidebar.className = "builder-roster-sidebar";

  const overview = renderRosterUnitOverview({
    onBack,
    onUpdate,
    otherIssueCount,
    roster,
    unit: summary,
    validation: unitValidation,
    validationContext,
  });
  const wargear = renderRosterUnitWargearSection({
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
    }),
    renderEnhancementsEditor({
      onUpdate,
      roster,
      unit: summary,
      validation: unitValidation,
      validationContext,
    })
  );
  root.append(sidebar, wargear);
  return root;
}

export { renderRosterUnitDetailView, unitDisplayName, unitValidationActionTarget };
