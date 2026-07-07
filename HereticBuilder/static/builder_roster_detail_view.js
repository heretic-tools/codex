import { rosterUnitSummaries } from "./builder_model.js";
import { attachmentEditorAvailable } from "./builder_roster_attachment_editor_view.js";
import { renderRosterEditor } from "./builder_roster_editor_view.js";
import { renderRosterOverview, renderRosterStickySummary } from "./builder_roster_overview_view.js";
import {
  renderValidationGroupAction,
  rosterValidationActionTarget,
} from "./builder_roster_validation_actions.js";
import {
  scrollToEditorTarget,
  scrollToUnitSearch,
} from "./builder_roster_validation_action_scroll.js";
import { validationContextForRoster } from "./builder_validation_context.js";
import { renderValidation } from "./builder_validation_view.js";

function scrollToRosterFocusTarget(focusTarget) {
  const prefix = "unitSearch:";
  if (String(focusTarget || "").startsWith(prefix)) {
    scrollToUnitSearch(focusTarget.slice(prefix.length));
    return;
  }
  if (focusTarget === "rename") {
    document.querySelector(".rename-roster-button")?.click();
  }
  scrollToEditorTarget(focusTarget);
}

function rosterDetailStickyActionDescriptors(validation, { hasAttachments = false } = {}) {
  const actions = [];
  if ((validation?.messages || []).length) {
    actions.push({ ariaLabel: "Review roster issues", label: "Issues", target: "validation" });
  }
  actions.push(
    { ariaLabel: "Add detachment", label: "+ Detach", primary: true, target: "detachments" },
    { ariaLabel: "Add unit", label: "+ Unit", primary: true, target: "units" }
  );
  if (hasAttachments) {
    actions.push({ ariaLabel: "Add attached unit", label: "Attach", target: "attachments" });
  }
  return actions;
}

function renderRosterDetailView({
  focusTarget = "",
  newId,
  onDelete,
  onDuplicate,
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
    onDuplicate,
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
  const stickyActions = rosterDetailStickyActionDescriptors(validationResult, {
    hasAttachments: attachmentEditorAvailable(roster, units),
  });
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
    window.requestAnimationFrame(() => scrollToRosterFocusTarget(focusTarget));
  }
  return root;
}

export {
  renderRosterDetailView,
  rosterDetailStickyActionDescriptors,
  rosterValidationActionTarget,
  scrollToRosterFocusTarget,
};
