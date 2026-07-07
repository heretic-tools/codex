import { button, textNode } from "./builder_dom.js";
import { labelControl } from "./builder_roster_control_labels.js";
import {
  scrollToEditorTarget,
  triggerEditorTargetPrimaryAction,
} from "./builder_roster_validation_action_scroll.js";
import { renderWarlordPicker } from "./builder_roster_warlord_picker.js";
import { validationCounts, validationSummary } from "./builder_validation_summary.js";

function rosterOverviewStateClass(validation) {
  if ((validation.messages || []).some((message) => message.level === "error")) {
    return "error";
  }
  if ((validation.messages || []).some((message) => message.level === "warning")) {
    return "warning";
  }
  return "ok";
}

function rosterOverviewStatusLabel(validation) {
  const counts = validationCounts(validation.messages || []);
  const parts = [];
  if (counts.error) {
    parts.push(`${counts.error} error${counts.error === 1 ? "" : "s"}`);
  }
  if (counts.warning) {
    parts.push(`${counts.warning} warning${counts.warning === 1 ? "" : "s"}`);
  }
  return parts.length ? parts.join(" / ") : "Valid";
}

function overviewMetric(label, value) {
  const node = document.createElement("div");
  node.className = "roster-overview-metric";
  node.append(textNode("span", "", label), textNode("strong", "", value));
  return node;
}

function validationPill(validation) {
  const stateClass = rosterOverviewStateClass(validation);
  const label = rosterOverviewStatusLabel(validation);
  return textNode("span", `roster-status-pill state-${stateClass}`, label);
}

function appendRosterMetrics(metrics, roster, validation) {
  const detachmentLimit = validation.points.detachmentLimit || 0;
  metrics.append(
    overviewMetric("Points", `${validation.points.total} / ${validation.points.limit}`),
    overviewMetric("DP", `${validation.points.detachmentPoints || 0} / ${detachmentLimit}`),
    overviewMetric("Units", String((roster.units || []).length))
  );
}

function renderRosterStickySummary({ actions = [], roster, validation }) {
  const summary = document.createElement("aside");
  summary.className = `roster-sticky-summary has-validation-${rosterOverviewStateClass(validation)}`;
  const metrics = document.createElement("div");
  metrics.className = "roster-sticky-summary-metrics";
  appendRosterMetrics(metrics, roster, validation);
  summary.append(
    validationPill(validation),
    metrics
  );
  if (actions.length) {
    summary.appendChild(renderStickySummaryActions(actions));
  }
  summary.dataset.validationSummary = validationSummary(validation);
  summary.setAttribute("aria-label", `Roster sticky summary: ${validationSummary(validation)}`);
  return summary;
}

function renderStickySummaryActions(actions = []) {
  const wrap = document.createElement("div");
  wrap.className = "roster-sticky-summary-actions";
  actions.forEach((action) => {
    const handler = action.primary
      ? () => triggerEditorTargetPrimaryAction(action.target)
      : () => scrollToEditorTarget(action.target);
    const node = button("roster-sticky-summary-action", action.label, handler);
    node.dataset.summaryTarget = action.target;
    node.dataset.summaryAction = action.primary ? "primary" : "scroll";
    node.setAttribute("aria-label", action.ariaLabel || `Go to ${action.label}`);
    wrap.appendChild(node);
  });
  return wrap;
}

function renderRosterOverview({ onDelete, onUndoableUpdate = null, onUpdate, roster, summary, validation }) {
  const overview = document.createElement("section");
  overview.className = `builder-section roster-overview-card has-validation-${rosterOverviewStateClass(validation)}`;
  const head = document.createElement("div");
  head.className = "roster-overview-head";
  head.append(
    textNode("h2", "section-title", `${summary.factionName} / ${summary.battleSizeName}`),
    validationPill(validation)
  );
  const metrics = document.createElement("div");
  metrics.className = "roster-overview-metrics";
  appendRosterMetrics(metrics, roster, validation);
  const controls = document.createElement("div");
  controls.className = "roster-overview-controls";
  controls.append(
    renderWarlordPicker({ onUndoableUpdate, onUpdate, roster }),
    labelControl(button("plain-button delete-roster-button", "Delete Roster", async () => onDelete(roster)), "Delete roster")
  );
  overview.append(
    head,
    metrics,
    controls
  );
  overview.dataset.validationSummary = validationSummary(validation);
  overview.setAttribute("aria-label", `Roster overview: ${validationSummary(validation)}`);
  return overview;
}

export {
  renderRosterOverview,
  renderRosterStickySummary,
  rosterOverviewStateClass,
  rosterOverviewStatusLabel,
};
