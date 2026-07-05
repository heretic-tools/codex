import { button, metricLine, option, textNode } from "./builder_dom.js";
import { rosterUnitSummaries } from "./builder_model.js";
import { rosterWithWarlord } from "./builder_roster_actions.js";
import { renderRosterEditor } from "./builder_roster_editor_view.js";
import {
  renderValidationGroupAction,
  rosterValidationActionTarget,
} from "./builder_roster_validation_actions.js";
import { state } from "./builder_state.js";
import { validationContextForRoster } from "./builder_validation_context.js";
import { renderValidation } from "./builder_validation_view.js";
import { warlordCandidateStatus } from "./builder_warlord_rules.js";

function warlordOptionValue(unit, miniature) {
  return JSON.stringify({
    rosterUnitMiniatureId: miniature.rosterUnitMiniatureId || miniature.id,
    unitId: unit.id,
  });
}

function selectedWarlordValue(units) {
  for (const unit of units) {
    const miniature = (unit.miniatures || []).find((item) => item.isWarlord && item.count > 0);
    if (miniature) {
      return warlordOptionValue(unit, miniature);
    }
  }
  return "";
}

function renderWarlordPicker({ onUpdate, roster }) {
  const units = rosterUnitSummaries(roster);
  const detachments = (roster.detachmentIds || []).map((id) => ({ id, ...state.catalog.detachmentById.get(id) }));
  const select = document.createElement("select");
  select.dataset.focusTarget = "true";
  select.appendChild(option("", units.length ? "No Warlord selected" : "Add units first"));
  const rows = units.flatMap((unit) => (unit.miniatures || [])
    .filter((miniature) => (miniature.count || 0) > 0)
    .map((miniature) => ({
      miniature,
      status: warlordCandidateStatus(roster, detachments, units, unit, miniature),
      unit,
    })))
    .sort((left, right) => Number(right.status.eligible) - Number(left.status.eligible)
      || String(left.unit.name || "").localeCompare(String(right.unit.name || ""))
      || String(left.miniature.name || "").localeCompare(String(right.miniature.name || "")));
  for (const row of rows) {
    const suffix = row.status.eligible ? "" : ` / ${row.status.reason}`;
    select.appendChild(option(
      warlordOptionValue(row.unit, row.miniature),
      `${row.unit.name || "Unit"} / ${row.miniature.name || "Model"} (${row.miniature.count || 0})${suffix}`
    ));
  }
  select.value = selectedWarlordValue(units);
  select.disabled = !units.length;
  select.addEventListener("change", async () => {
    await onUpdate(select.value ? rosterWithWarlord(roster, JSON.parse(select.value)) : rosterWithWarlord(roster, {}));
  });

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.editorTarget = "warlord";
  wrap.append(textNode("span", "", "Warlord"), select);
  return wrap;
}

function renderRosterDetailView({ newId, onDelete, onUnitOpen, onUpdate, roster, summarizeRoster, validation, validateRoster }) {
  const summary = summarizeRoster(roster);
  const validationResult = validation || validateRoster(roster);
  const units = rosterUnitSummaries(roster);
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const root = document.createElement("section");
  root.className = "builder-grid";
  const sidebar = document.createElement("section");
  sidebar.className = "builder-roster-sidebar";
  const overview = document.createElement("section");
  overview.className = "builder-section";
  overview.append(
    textNode("h2", "section-title", `${summary.factionName} / ${summary.battleSizeName}`),
    metricLine("Points", `${validationResult.points.total} / ${validationResult.points.limit}`),
    renderWarlordPicker({ onUpdate, roster }),
    button("plain-button", "Delete Roster", async () => onDelete(roster))
  );
  const editor = renderRosterEditor({ newId, onUnitOpen, onUpdate, roster, validation: validationResult });
  const validationView = renderValidation(validationResult, {
    context: validationContextForRoster(roster),
    groupAction: (group) => renderValidationGroupAction(group, { onUnitOpen, roster, unitById }),
  });
  sidebar.append(overview, validationView);
  root.append(sidebar, editor);
  return root;
}

export { renderRosterDetailView, rosterValidationActionTarget };
