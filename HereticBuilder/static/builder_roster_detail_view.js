import { rosterUnitSummaries } from "./builder_model.js";
import { attachmentEditorAvailable } from "./builder_roster_attachment_editor_view.js";
import { renderRosterEditor } from "./builder_roster_editor_view.js";
import { renderRosterOverview, renderRosterStickySummary } from "./builder_roster_overview_view.js";
import {
  renderValidationGroupAction,
  rosterValidationActionTarget,
} from "./builder_roster_validation_actions.js";
import { scrollToEditorTarget } from "./builder_roster_validation_action_scroll.js";
import { validationContextForRoster } from "./builder_validation_context.js";
import { renderValidation } from "./builder_validation_view.js";

function renderRosterDetailView({
  focusTarget = "",
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
  const stickyActions = [
    { ariaLabel: "Review roster issues", label: "Issues", target: "validation" },
    { ariaLabel: "Add detachment", label: "+ Detach", primary: true, target: "detachments" },
    { ariaLabel: "Add unit", label: "+ Unit", primary: true, target: "units" },
  ];
  if (attachmentEditorAvailable(roster, units)) {
    stickyActions.push({ ariaLabel: "Add attached unit", label: "Attach", target: "attachments" });
  }
  const stickySummary = renderRosterStickySummary({
    actions: stickyActions,
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
  if (focusTarget) {
    window.requestAnimationFrame(() => scrollToEditorTarget(focusTarget));
  }
  return root;
}

export { renderRosterDetailView, rosterValidationActionTarget };
