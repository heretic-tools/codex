import { button, textNode } from "./builder_dom.js";
import { labelControl } from "./builder_roster_control_labels.js";
import { rosterDisplayName, rosterWithName } from "./builder_roster_name_actions.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
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

function metricLabel(label, current, limit = null) {
  return limit ? `${label} ${current} of ${limit}` : `${label} ${current}`;
}

function rosterMetricsLabel(roster, validation) {
  const detachmentLimit = validation.points.detachmentLimit || 0;
  return [
    metricLabel("Points", validation.points.total, validation.points.limit),
    metricLabel("DP", validation.points.detachmentPoints || 0, detachmentLimit),
    metricLabel("Units", (roster.units || []).length),
  ].join(", ");
}

function rosterOverviewLabel(prefix, roster, validation, summary = null) {
  const parts = [
    summary ? `${summary.factionName} / ${summary.battleSizeName}` : "",
    validationSummary(validation),
    rosterMetricsLabel(roster, validation),
  ].filter(Boolean);
  return `${prefix}: ${parts.join("; ")}`;
}

function rosterOverviewActionLabel(roster, action, summary = null) {
  return `${action}: ${rosterDisplayName(roster, summary)}`;
}

function renderRosterStickySummary({ actions = [], roster, validation }) {
  const summary = document.createElement("aside");
  summary.className = [
    "roster-sticky-summary",
    `has-validation-${rosterOverviewStateClass(validation)}`,
    actions.length ? "has-actions" : "",
  ].filter(Boolean).join(" ");
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
  summary.setAttribute("aria-label", rosterOverviewLabel("Roster sticky summary", roster, validation));
  return summary;
}

function renderStickySummaryActions(actions = []) {
  const wrap = document.createElement("div");
  wrap.className = "roster-sticky-summary-actions";
  actions.forEach((action) => {
    const handler = action.onClick
      || (action.primary
      ? () => triggerEditorTargetPrimaryAction(action.target)
      : () => scrollToEditorTarget(action.target));
    const node = button("roster-sticky-summary-action", action.label, handler);
    const label = action.ariaLabel || `Go to ${action.label}`;
    node.dataset.summaryTarget = action.target;
    node.dataset.summaryAction = action.action || (action.primary ? "primary" : "scroll");
    node.title = label;
    node.setAttribute("aria-label", label);
    wrap.appendChild(node);
  });
  return wrap;
}

function renderRenameRosterForm({ formId, onUndoableUpdate, onUpdate, roster }) {
  const form = document.createElement("form");
  form.className = "roster-rename-form";
  form.dataset.editorTarget = "rename";
  form.hidden = true;
  const input = document.createElement("input");
  input.autocomplete = "off";
  input.dataset.focusTarget = "true";
  input.maxLength = 80;
  input.name = "rosterName";
  input.value = roster.name || "";
  input.setAttribute("aria-label", "Roster name");
  input.setAttribute("title", "Roster name");
  const save = labelControl(textNode("button", "plain-button", "Save"), "Save roster name");
  save.type = "submit";
  const cancel = labelControl(button("plain-button", "Cancel", () => {
    input.value = roster.name || "";
    form.hidden = true;
  }), "Cancel roster rename");
  form.append(input, save, cancel);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nextRoster = rosterWithName(roster, input.value);
    form.hidden = true;
    await applyRosterUpdate({
      message: "Roster renamed",
      nextRoster,
      onUndoableUpdate,
      onUpdate,
      previousRoster: roster,
    });
  });
  form.id = formId;
  return { form, input };
}

function renderRosterOverview({ onDelete, onDuplicate = null, onUndoableUpdate = null, onUpdate, roster, summary, validation }) {
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
  const renameFormId = `rename-roster-${roster.id || "local"}`;
  const rename = renderRenameRosterForm({
    formId: renameFormId,
    onUndoableUpdate,
    onUpdate,
    roster,
  });
  const warlordPicker = renderWarlordPicker({ onUndoableUpdate, onUpdate, roster });
  if (warlordPicker) {
    controls.appendChild(warlordPicker);
  }
  controls.append(
    labelControl(button("plain-button rename-roster-button", "Rename Roster", () => {
      rename.form.hidden = false;
      rename.input.focus?.();
      rename.input.select?.();
    }), rosterOverviewActionLabel(roster, "Rename roster", summary))
  );
  controls.appendChild(rename.form);
  if (onDuplicate) {
    controls.append(
      labelControl(button("plain-button duplicate-roster-button", "Duplicate Roster", async () => onDuplicate(roster)), rosterOverviewActionLabel(roster, "Duplicate roster", summary))
    );
  }
  controls.append(
    labelControl(button("plain-button delete-roster-button", "Delete Roster", async () => onDelete(roster)), rosterOverviewActionLabel(roster, "Delete roster", summary))
  );
  overview.append(
    head,
    metrics,
    controls
  );
  overview.dataset.validationSummary = validationSummary(validation);
  overview.setAttribute("aria-label", rosterOverviewLabel("Roster overview", roster, validation, summary));
  return overview;
}

export {
  renderRosterOverview,
  renderRosterStickySummary,
  rosterMetricsLabel,
  rosterOverviewStateClass,
  rosterOverviewStatusLabel,
};
