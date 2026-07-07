import { rosterUnitSummaries, unitSummary } from "./builder_model.js";
import { validationContextForRoster } from "./builder_validation_context.js";
import { renderValidation, validationForUnit } from "./builder_validation_view.js";
import {
  renderRosterValidationActionLink,
  renderUnitValidationAction,
  scrollToUnitDetailTarget,
  unitValidationActionTarget,
} from "./builder_roster_unit_detail_actions.js";
import {
  renderEnhancementsEditor,
  unitHasCompositionChoices,
} from "./builder_roster_unit_detail_editors.js";
import { renderRosterStickySummary } from "./builder_roster_overview_view.js";
import { renderRosterUnitOverview, unitDisplayName } from "./builder_roster_unit_overview_view.js";
import { renderRosterUnitWargearSection } from "./builder_roster_unit_wargear_section_view.js";
import { state } from "./builder_state.js";

function validationWithoutMessages(validation, excludedMessages) {
  const excluded = new Set(excludedMessages || []);
  const messages = (validation.messages || []).filter((message) => !excluded.has(message));
  return {
    ...validation,
    messages,
    state: messages.some((message) => message.level === "error") ? "invalid" : "valid",
  };
}

function validationHasMessages(validation) {
  return Boolean((validation?.messages || []).length);
}

function stickyEnhancementsLabel(sectionTitle = "") {
  if (sectionTitle === "Enhancements & Upgrades") {
    return "Upgrades";
  }
  if (sectionTitle === "Enhancements") {
    return "Enhance";
  }
  return sectionTitle || "Upgrades";
}

function unitDetailStickyActionDescriptors({
  hasAllegiance = false,
  hasComposition = false,
  hasEnhancements = false,
  enhancementsLabel = "Upgrades",
  hasValidation = false,
  hasWargear = false,
  hasWarlord = false,
} = {}) {
  const actions = [];
  if (hasValidation) {
    actions.push({ ariaLabel: "Review unit issues", label: "Issues", target: "validation" });
  }
  actions.push({ ariaLabel: "Review unit profile", label: "Unit", target: "overview" });
  if (hasComposition) {
    actions.push({ ariaLabel: "Edit unit composition", label: "Models", target: "composition" });
  }
  if (hasWarlord) {
    actions.push({ ariaLabel: "Edit unit Warlord", label: "Warlord", target: "warlord" });
  }
  if (hasAllegiance) {
    actions.push({ ariaLabel: "Edit unit ability", label: "Ability", target: "allegiance" });
  }
  if (hasWargear) {
    actions.push({ ariaLabel: "Edit unit wargear", label: "Wargear", target: "wargear" });
  }
  if (hasEnhancements) {
    const label = stickyEnhancementsLabel(enhancementsLabel);
    actions.push({
      ariaLabel: `Edit unit ${String(enhancementsLabel || label).toLowerCase()}`,
      label,
      target: "enhancements",
    });
  }
  return actions;
}

function renderRosterUnitDetailView({ focusTarget = "", onUndoableUpdate = null, onUpdate, roster, unit, validation }) {
  const summary = unitSummary(roster, unit);
  const unitValidation = validationForUnit(validation, summary);
  const otherValidation = validationWithoutMessages(validation, unitValidation.messages);
  const validationContext = validationContextForRoster(roster);
  const unitById = new Map(rosterUnitSummaries(roster).map((item) => [item.id, item]));
  const root = document.createElement("section");
  root.className = "builder-grid unit-detail-grid";

  const sidebar = document.createElement("section");
  sidebar.className = "builder-roster-sidebar";

  const overview = renderRosterUnitOverview({
    onUndoableUpdate,
    onUpdate,
    roster,
    unit: summary,
    validation: unitValidation,
    validationContext,
  });
  const overviewTargets = new Set(
    Array.from(overview.querySelectorAll("[data-unit-detail-target]"))
      .map((node) => node.dataset.unitDetailTarget)
      .filter(Boolean)
  );
  const wargear = renderRosterUnitWargearSection({
    onUndoableUpdate,
    onUpdate,
    roster,
    unit: summary,
    validation: unitValidation,
    validationContext,
  });

  sidebar.appendChild(overview);
  let hasValidation = false;
  if (validationHasMessages(unitValidation)) {
    const unitValidationView = renderValidation(unitValidation, {
      context: validationContext,
      groupAction: (group) => renderUnitValidationAction(group, { roster }),
      title: "Unit Validation",
    });
    unitValidationView.dataset.unitDetailTarget = "validation";
    hasValidation = true;
    sidebar.appendChild(unitValidationView);
  }
  if (validationHasMessages(otherValidation)) {
    const rosterIssuesView = renderValidation(otherValidation, {
      context: validationContext,
      groupAction: (group) => renderRosterValidationActionLink(group, {
        datasheetById: state.catalog.datasheetById,
        localTargets: overviewTargets,
        roster,
        unitById,
      }),
      title: "Roster Issues",
    });
    if (!hasValidation) {
      rosterIssuesView.dataset.unitDetailTarget = "validation";
      hasValidation = true;
    }
    sidebar.appendChild(rosterIssuesView);
  }
  const enhancementsEditor = renderEnhancementsEditor({
    onUndoableUpdate,
    onUpdate,
    roster,
    unit: summary,
    validation: unitValidation,
    validationContext,
  });
  if (enhancementsEditor) {
    sidebar.appendChild(enhancementsEditor);
  }
  const stickySummary = renderRosterStickySummary({
    actions: unitDetailStickyActionDescriptors({
      hasAllegiance: overviewTargets.has("allegiance"),
      hasComposition: unitHasCompositionChoices(roster, summary),
      hasEnhancements: Boolean(enhancementsEditor),
      enhancementsLabel: enhancementsEditor?.dataset.sectionTitle || "Upgrades",
      hasValidation,
      hasWargear: Boolean(wargear),
      hasWarlord: overviewTargets.has("warlord"),
    }).map((action) => ({
      ...action,
      action: "unit-detail",
      onClick: () => scrollToUnitDetailTarget(action.target),
    })),
    roster,
    validation,
  });
  root.append(stickySummary, sidebar);
  if (wargear) {
    root.appendChild(wargear);
  }
  if (focusTarget) {
    window.requestAnimationFrame(() => scrollToUnitDetailTarget(focusTarget));
  }
  return root;
}

export {
  renderRosterUnitDetailView,
  unitDisplayName,
  unitDetailStickyActionDescriptors,
  unitValidationActionTarget,
  stickyEnhancementsLabel,
  validationHasMessages,
  validationWithoutMessages,
};
