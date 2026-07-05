import { button, option, textNode } from "./builder_dom.js";
import {
  alliedFactionName,
  availableDatasheets,
  availableUnitSources,
  compositionFactionIds,
  defaultComposition,
  rosterUnitSummaries,
  unitSummary,
} from "./builder_model.js";
import {
  rosterWithAddedUnit,
  rosterWithRemovedUnit,
} from "./builder_roster_actions.js";
import {
  emptyMessage,
  removeButton,
  sectionTitle,
} from "./builder_roster_editor_dom.js";
import { state } from "./builder_state.js";
import { unitImageNode } from "./builder_unit_images.js";
import { duplicateLimitForUnit } from "./builder_validation_core.js";
import { validationForUnit } from "./builder_validation_view.js";

function unitOptionLabel(roster, allyType, datasheet) {
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []);
  const points = composition ? `${composition.points || 0} pts` : "no composition";
  return `${datasheet.name} (${points})`;
}

function candidateSummary(roster, allyType, datasheet) {
  const unitId = `candidate:${allyType}:${datasheet.id}`;
  const candidateRoster = rosterWithAddedUnit(roster, {
    allyType,
    datasheetId: datasheet.id,
    unitId,
  });
  const unit = (candidateRoster.units || []).find((item) => item.id === unitId);
  return unit ? unitSummary(candidateRoster, unit) : null;
}

function unitCandidateStatus(roster, validation, candidate, currentUnits = rosterUnitSummaries(roster)) {
  if (!candidate) {
    return { severity: "error", reason: "no composition" };
  }
  const battleSize = state.catalog.battleSizeById.get(roster.battleSizeId);
  const duplicateLimit = duplicateLimitForUnit(candidate, battleSize?.duplicateUnitLimit || 3);
  const currentCount = currentUnits.filter((unit) => unit.datasheetId === candidate.datasheetId).length;
  if (currentCount >= duplicateLimit) {
    return { severity: "error", reason: `limit ${duplicateLimit} reached` };
  }
  const pointsLimit = validation.points?.limit || 0;
  const nextPoints = (validation.points?.total || 0) + (candidate.points || 0);
  if (pointsLimit && nextPoints > pointsLimit) {
    return { severity: "warning", reason: `${nextPoints - pointsLimit} pts over` };
  }
  return { severity: "ok", reason: "" };
}

function unitOptionText(roster, allyType, datasheet, status) {
  const label = unitOptionLabel(roster, allyType, datasheet);
  return status.reason ? `${label} / ${status.reason}` : label;
}

function compactBadgeLabel(value, maxLength = 28) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function unitSourceBadgeText(unit) {
  const allyType = unit.allyType || "native";
  if (allyType === "native") {
    return "";
  }
  return `Allied: ${compactBadgeLabel(alliedFactionName(allyType))}`;
}

function unitSourceBadgeNode(unit) {
  const text = unitSourceBadgeText(unit);
  if (!text) {
    return null;
  }
  const badge = textNode("span", "meta-badge", text);
  badge.title = `Allied: ${alliedFactionName(unit.allyType)}`;
  return badge;
}

function unitOptionValue(allyType, datasheetId) {
  return JSON.stringify({ allyType, datasheetId });
}

function parseUnitOptionValue(value) {
  try {
    const parsed = JSON.parse(value);
    return {
      allyType: parsed.allyType || "native",
      datasheetId: parsed.datasheetId || "",
    };
  } catch {
    return { allyType: "native", datasheetId: value || "" };
  }
}

function unitCandidateGroups(roster, validation, query = "") {
  const normalizedQuery = String(query || "").trim().toLocaleLowerCase();
  const summaries = rosterUnitSummaries(roster);
  return availableUnitSources(roster)
    .map((source) => {
      const rows = availableDatasheets(roster, source.value)
        .filter((datasheet) => (
          !normalizedQuery || String(datasheet.name || "").toLocaleLowerCase().includes(normalizedQuery)
        ))
        .map((datasheet, index) => {
          const candidate = candidateSummary(roster, source.value, datasheet);
          return {
            allyType: source.value,
            candidate,
            datasheet,
            index,
            status: unitCandidateStatus(roster, validation, candidate, summaries),
          };
        })
        .sort((left, right) => (
          Number(right.status.severity === "ok") - Number(left.status.severity === "ok")
          || Number(right.status.severity === "warning") - Number(left.status.severity === "warning")
          || left.index - right.index
        ));
      return { rows, source };
    })
    .filter((group) => group.rows.length);
}

function unitValidationStatus(validation, summary) {
  const messages = validationForUnit(validation, summary).messages || [];
  const errors = messages.filter((message) => message.level === "error").length;
  const warnings = messages.filter((message) => message.level === "warning").length;
  if (errors) {
    return { className: "error", text: `${errors} error${errors === 1 ? "" : "s"}` };
  }
  if (warnings) {
    return { className: "warning", text: `${warnings} warning${warnings === 1 ? "" : "s"}` };
  }
  return null;
}

function renderUnitRow(roster, summary, validation, onUpdate, onUnitOpen) {
  const row = document.createElement("div");
  row.className = "builder-row editor-row unit-editor-row";
  const validationStatus = unitValidationStatus(validation, summary);
  if (validationStatus) {
    row.classList.add(`has-validation-${validationStatus.className}`);
  }
  const text = button("unit-open-button", "", () => onUnitOpen(summary));
  text.className = "unit-open-button row-text";
  const image = unitImageNode(summary.datasheetId);
  if (image) {
    text.appendChild(image);
  }
  text.append(
    textNode("strong", "", summary.name || "Unit"),
    textNode("span", "", `${summary.modelCount || 0} models`)
  );
  if (summary.isWarlord) {
    text.append(textNode("span", "meta-badge", "Warlord"));
  }
  const sourceBadge = unitSourceBadgeNode(summary);
  if (sourceBadge) {
    text.append(sourceBadge);
  }
  if (validationStatus) {
    text.append(textNode("span", `validation-state-badge state-${validationStatus.className}`, validationStatus.text));
  }
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", "", `${summary.points || 0} pts`),
    removeButton("Remove unit", async () => onUpdate(rosterWithRemovedUnit(roster, summary.id)))
  );
  row.append(text, meta);
  return row;
}

function renderUnitEditor({ newId, onUpdate, onUnitOpen, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.dataset.editorTarget = "units";
  root.append(sectionTitle(
    `Units (${(roster.units || []).length})`,
    `${validation.points.total} / ${validation.points.limit} pts`
  ));

  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search";
  search.autocomplete = "off";
  search.dataset.focusTarget = "true";
  const searchWrap = document.createElement("span");
  searchWrap.className = "builder-search-field";
  const clearSearch = button("remove-button search-clear-button", "x", () => {
    search.value = "";
    refreshOptions();
    search.focus();
  });
  clearSearch.setAttribute("aria-label", "Clear search");
  searchWrap.append(search, clearSearch);
  const unitSelect = document.createElement("select");
  const add = button("plain-button add-button", "Add", async () => {
    const selected = parseUnitOptionValue(unitSelect.value);
    await onUpdate(rosterWithAddedUnit(roster, {
      allyType: selected.allyType,
      datasheetId: selected.datasheetId,
      unitId: newId(),
    }));
  });
  const refreshOptions = () => {
    const groups = unitCandidateGroups(roster, validation, search.value);
    const nodes = groups.map((group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.source.label;
      optgroup.replaceChildren(...group.rows.map((row) => option(
        unitOptionValue(row.allyType, row.datasheet.id),
        unitOptionText(roster, row.allyType, row.datasheet, row.status)
      )));
      return optgroup;
    });
    if (!nodes.length) {
      const empty = option("", search.value.trim() ? "No matching units" : "No units available");
      empty.disabled = true;
      nodes.push(empty);
    }
    unitSelect.replaceChildren(...nodes);
    add.disabled = !groups.length;
    unitSelect.disabled = !groups.length;
    clearSearch.hidden = !search.value;
  };
  search.addEventListener("input", refreshOptions);
  refreshOptions();

  const list = document.createElement("div");
  list.className = "editor-list";
  const summaries = rosterUnitSummaries(roster);
  if (summaries.length) {
    for (const summary of summaries) {
      list.appendChild(renderUnitRow(roster, summary, validation, onUpdate, onUnitOpen));
    }
  } else {
    list.appendChild(emptyMessage("No units"));
  }
  root.appendChild(list);

  const controls = document.createElement("div");
  controls.className = "builder-control-row unit-control-row";
  controls.append(searchWrap, unitSelect, add);
  root.appendChild(controls);
  return root;
}

export {
  parseUnitOptionValue,
  renderUnitEditor,
  unitCandidateGroups,
  unitCandidateStatus,
  unitOptionValue,
  unitSourceBadgeText,
};
