import { button, metricLine, option, textNode } from "./builder_dom.js";
import { detachmentCodexHref } from "./builder_codex_links.js";
import { rosterUnitSummaries } from "./builder_model.js";
import { rosterWithWarlord } from "./builder_roster_actions.js";
import { renderRosterEditor } from "./builder_roster_editor_view.js";
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

function validationActionLink(text, href) {
  const node = document.createElement("a");
  node.className = "validation-action-button";
  node.textContent = text;
  node.href = href;
  return node;
}

function scrollToEditorRow(attributeName, value) {
  const selectorValue = window.CSS?.escape ? CSS.escape(value) : String(value).replace(/"/g, "");
  const datasetName = attributeName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const row = document.querySelector(`[data-${attributeName}="${selectorValue}"]`)
    || [...document.querySelectorAll(`[data-${attributeName}]`)].find((node) => node.dataset[datasetName] === value);
  scrollToElement(row);
}

function scrollToEditorTarget(target) {
  const selectorValue = window.CSS?.escape ? CSS.escape(target) : String(target).replace(/"/g, "");
  scrollToElement(document.querySelector(`[data-editor-target="${selectorValue}"]`));
}

function scrollToUnitSearch(query = "") {
  const unitSection = document.querySelector('[data-editor-target="units"]');
  const search = unitSection?.querySelector('[data-focus-target]');
  if (search && query && "value" in search) {
    search.value = query;
    search.dispatchEvent(new Event("input", { bubbles: true }));
  }
  scrollToElement(unitSection);
}

function scrollToElement(node) {
  if (!node) {
    return;
  }
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusTarget = node.querySelector("[data-focus-target]")
    || (node.matches("button, input, select, textarea, a")
    ? node
    : node.querySelector("button, input, select, textarea, a"));
  focusTarget?.focus({ preventScroll: true });
  node.classList.add("is-attention-target");
  window.setTimeout(() => node.classList.remove("is-attention-target"), 900);
}

function rosterValidationActionTarget(group) {
  const attachmentIds = group.attachmentIds || [];
  const datasheetIds = group.datasheetIds || [];
  const detachmentIds = group.detachmentIds || [];
  const unitIds = group.unitIds || [];
  if (datasheetIds.length === 1 && [
    "detachment.datasheets_missing",
    "detachment.linked_datasheet_count_mismatch",
    "mandatory_warlord.not_present_in_roster",
  ].includes(group.code)) {
    return { datasheetId: datasheetIds[0], kind: "unitSearch", text: "Find" };
  }
  const codeTarget = rosterValidationCodeActionTarget(group.code);
  if (codeTarget) {
    return codeTarget;
  }
  if (unitIds.length === 1) {
    return { kind: "unit", text: "Open", unitId: unitIds[0] };
  }
  if (attachmentIds.length === 1) {
    return { attribute: "attachment-id", kind: "row", text: "Show", value: attachmentIds[0] };
  }
  if (detachmentIds.length === 1) {
    return { detachmentId: detachmentIds[0], kind: "detachmentCodex", text: "Codex" };
  }
  if (unitIds.length > 1) {
    return { kind: "target", target: "units", text: "Units" };
  }
  if (detachmentIds.length > 1) {
    return { kind: "target", target: "detachments", text: "Detachments" };
  }
  if (attachmentIds.length > 1) {
    return { kind: "target", target: "attachments", text: "Attached" };
  }
  return null;
}

function rosterValidationCodeActionTarget(code) {
  switch (code) {
    case "mandatory_warlord.not_selected":
    case "mandatory_warlord.detachment_not_selected":
    case "mandatory_warlord.supreme_commander_not_selected":
    case "allied_units.required_warlord_missing":
    case "warlord.invalid_generic":
    case "warlord.multiple_selected":
    case "warlord.not_selected":
      return { kind: "target", target: "warlord", text: "Pick" };
    case "allied_unit.required_detachment_not_selected":
    case "roster.detachment_missing":
    case "roster.detachment_not_selected":
    case "roster.detachment_points_limit_exceeded":
      return { kind: "target", target: "detachments", text: "Detachments" };
    case "allegiance_ability.group_limit_exceeded":
    case "allegiance_ability.group_limit_not_reached":
    case "allied_faction.datasheet_not_allowed":
    case "allied_faction.not_available":
    case "allied_keyword_count.invalid_mutually_exclusive_keywords":
    case "allied_keyword_count.limit_exceeded":
    case "allied_keyword_restricting_keyword.outnumbered_keywords":
    case "allied_points.limit_exceeded":
    case "allied_unit.required_allegiance_ability_missing":
    case "enhancement.combat_patrol_multiple_selected":
    case "enhancement.combat_patrol_not_allowed":
    case "enhancement.combat_patrol_required":
    case "enhancement.models_have_same_enhancements":
    case "enhancement.roster_has_too_many_enhancements":
    case "detachment.datasheets_missing":
    case "detachment.linked_datasheet_count_mismatch":
    case "keyword_restriction_group.limit_exceeded":
    case "keyword_restriction_group.minimum_not_met":
    case "keyword_restriction_group.limit_zero":
    case "mandatory_warlord.not_present_in_roster":
    case "roster.empty":
    case "roster.points_limit_exceeded":
      return { kind: "target", target: "units", text: "Units" };
    default:
      return null;
  }
}

function renderValidationGroupAction(group, { onUnitOpen, roster, unitById }) {
  const action = rosterValidationActionTarget(group);
  if (!action) {
    return null;
  }
  if (action.kind === "unit") {
    const unit = unitById.get(action.unitId);
    return unit ? button("validation-action-button", action.text, () => onUnitOpen(unit)) : null;
  }
  if (action.kind === "detachmentCodex") {
    const href = detachmentCodexHref(roster.factionKeywordId, action.detachmentId);
    return href ? validationActionLink(action.text, href) : null;
  }
  if (action.kind === "row") {
    return button("validation-action-button", action.text, () => scrollToEditorRow(action.attribute, action.value));
  }
  if (action.kind === "unitSearch") {
    const query = state.catalog.datasheetById.get(action.datasheetId)?.name || "";
    return button("validation-action-button", action.text, () => scrollToUnitSearch(query));
  }
  return button("validation-action-button", action.text, () => scrollToEditorTarget(action.target));
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
