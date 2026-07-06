import { rosterUnitSummaries } from "./builder_model.js";
import { renderRosterEditor } from "./builder_roster_editor_view.js";
import { renderRosterOverview, renderRosterStickySummary } from "./builder_roster_overview_view.js";
import {
  renderValidationGroupAction,
  rosterValidationActionTarget,
} from "./builder_roster_validation_actions.js";
import { validationContextForRoster } from "./builder_validation_context.js";
import { renderValidation } from "./builder_validation_view.js";

function renderRosterDetailView({
  newId,
  onDelete,
  onUndoableUpdate = null,
  onUnitOpen,
  onUpdate,
  roster,
  summarizeRoster,
  validation,
  validateRoster,
}) {
  const summary = summarizeRoster(roster);
  const validationResult = validation || validateRoster(roster);
  const units = rosterUnitSummaries(roster);
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const root = document.createElement("section");
  root.className = "builder-grid roster-detail-grid";
  const sidebar = document.createElement("section");
  sidebar.className = "builder-roster-sidebar";
  const overview = renderRosterOverview({
    onDelete,
    onUndoableUpdate,
    onUpdate,
    roster,
    summary,
    validation: validationResult,
  });
  const editor = renderRosterEditor({
    newId,
    onUndoableUpdate,
    onUnitOpen,
    onUpdate,
    roster,
    validation: validationResult,
  });
  const stickySummary = renderRosterStickySummary({
    actions: [
      { ariaLabel: "Review roster issues", label: "Issues", target: "validation" },
      { ariaLabel: "Add detachment", label: "+ Detach", target: "detachments" },
      { ariaLabel: "Add unit", label: "+ Unit", target: "units" },
      { ariaLabel: "Add attached unit", label: "Attach", target: "attachments" },
    ],
    roster,
    validation: validationResult,
  });
  const validationView = renderValidation(validationResult, {
    context: validationContextForRoster(roster),
    groupAction: (group) => renderValidationGroupAction(group, { onUnitOpen, roster, unitById }),
    title: "Roster Validation",
  });
  validationView.dataset.editorTarget = "validation";
  sidebar.append(overview, validationView);
  root.append(stickySummary, sidebar, editor);
  return root;
}

export { renderRosterDetailView, rosterValidationActionTarget };
