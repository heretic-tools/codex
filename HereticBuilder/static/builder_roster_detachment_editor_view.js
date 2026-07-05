import { button, option, textNode } from "./builder_dom.js";
import { detachmentCodexHref } from "./builder_codex_links.js";
import {
  availableDetachments,
  costForDetachment,
  detachmentDispositionName,
} from "./builder_model.js";
import {
  rosterWithAddedDetachment,
  rosterWithRemovedDetachment,
} from "./builder_roster_actions.js";
import {
  dispositionSlug,
  emptyMessage,
  removeButton,
  sectionTitle,
} from "./builder_roster_editor_dom.js";
import { state } from "./builder_state.js";
import { validationForDetachment } from "./builder_validation_view.js";

function detachmentOptionLabel(roster, detachment) {
  const disposition = detachmentDispositionName(detachment) || "No disposition";
  return `${detachment.name} (${disposition} / ${costForDetachment(detachment.id, roster.factionKeywordId)} DP)`;
}

function detachmentCandidateStatus(roster, validation, detachment) {
  const limit = validation.points?.detachmentLimit || 0;
  if (!limit) {
    return { severity: "ok", reason: "" };
  }
  const next = (validation.points?.detachmentPoints || 0) + costForDetachment(detachment.id, roster.factionKeywordId);
  if (next > limit) {
    return { severity: "warning", reason: `${next - limit} DP over` };
  }
  return { severity: "ok", reason: "" };
}

function detachmentOptionText(roster, detachment, status) {
  const label = detachmentOptionLabel(roster, detachment);
  return status.reason ? `${label} / ${status.reason}` : label;
}

function detachmentCandidateRows(roster, validation, query = "") {
  const normalizedQuery = String(query || "").trim().toLocaleLowerCase();
  return availableDetachments(roster.factionKeywordId)
    .map((detachment, index) => ({
      detachment,
      index,
      status: detachmentCandidateStatus(roster, validation, detachment),
    }))
    .filter((row) => !(roster.detachmentIds || []).includes(row.detachment.id))
    .filter((row) => (
      !normalizedQuery
      || String(row.detachment.name || "").toLocaleLowerCase().includes(normalizedQuery)
      || String(detachmentDispositionName(row.detachment) || "").toLocaleLowerCase().includes(normalizedQuery)
    ))
    .sort((left, right) => (
      Number(right.status.severity === "ok") - Number(left.status.severity === "ok")
      || left.index - right.index
    ));
}

function detachmentValidationStatus(validation, detachmentId) {
  const messages = validationForDetachment(validation, detachmentId).messages || [];
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

function renderDetachmentRow(roster, detachmentId, index, validation, onUpdate) {
  const detachment = state.catalog.detachmentById.get(detachmentId)
    || availableDetachments(roster.factionKeywordId).find((item) => item.id === detachmentId);
  const row = document.createElement("div");
  row.className = "builder-row editor-row detachment-editor-row";
  row.dataset.detachmentId = detachmentId;
  const validationStatus = detachmentValidationStatus(validation, detachmentId);
  if (validationStatus) {
    row.classList.add(`has-validation-${validationStatus.className}`);
  }
  const href = detachmentCodexHref(roster.factionKeywordId, detachmentId);
  const text = document.createElement(href ? "a" : "span");
  text.className = "row-text detachment-open-link";
  if (href) {
    text.href = href;
  }
  text.append(textNode("strong", "", detachment?.name || "Unknown Detachment"));
  const disposition = detachment ? detachmentDispositionName(detachment) : "";
  if (disposition) {
    text.append(textNode("span", `disposition-badge disposition-${dispositionSlug(disposition)}`, disposition));
  }
  if (validationStatus) {
    text.append(textNode("span", `validation-state-badge state-${validationStatus.className}`, validationStatus.text));
  }
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", "", `${detachment ? costForDetachment(detachment.id, roster.factionKeywordId) : 0} DP`),
    removeButton("Remove detachment", async () => onUpdate(rosterWithRemovedDetachment(roster, index)))
  );
  row.append(text, meta);
  return row;
}

function renderDetachmentEditor({ onUpdate, roster, validation }) {
  const root = document.createElement("section");
  root.className = "builder-section";
  root.dataset.editorTarget = "detachments";
  const current = validation.points.detachmentPoints || 0;
  const max = validation.points.detachmentLimit || "";
  root.append(sectionTitle(
    `Detachments (${(roster.detachmentIds || []).length})`,
    max ? `${current} / ${max} DP` : `${current} DP`
  ));

  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search";
  search.autocomplete = "off";
  const searchWrap = document.createElement("span");
  searchWrap.className = "builder-search-field";
  const clearSearch = button("remove-button search-clear-button", "x", () => {
    search.value = "";
    refreshOptions();
    search.focus();
  });
  clearSearch.setAttribute("aria-label", "Clear search");
  searchWrap.append(search, clearSearch);
  const select = document.createElement("select");
  select.dataset.focusTarget = "true";
  const add = button("plain-button add-button", "Add", async () => {
    await onUpdate(rosterWithAddedDetachment(roster, select.value));
  });
  const refreshOptions = () => {
    const rows = detachmentCandidateRows(roster, validation, search.value);
    const nodes = rows.map((row) => (
      option(row.detachment.id, detachmentOptionText(roster, row.detachment, row.status))
    ));
    if (!nodes.length) {
      const empty = option("", search.value.trim() ? "No matching detachments" : "No detachments available");
      empty.disabled = true;
      nodes.push(empty);
    }
    select.replaceChildren(...nodes);
    add.disabled = !rows.length;
    select.disabled = !rows.length;
    clearSearch.hidden = !search.value;
  };
  search.addEventListener("input", refreshOptions);
  refreshOptions();

  const list = document.createElement("div");
  list.className = "editor-list";
  if ((roster.detachmentIds || []).length) {
    (roster.detachmentIds || []).forEach((detachmentId, index) => {
      list.appendChild(renderDetachmentRow(roster, detachmentId, index, validation, onUpdate));
    });
  } else {
    list.appendChild(emptyMessage("No detachments"));
  }
  root.appendChild(list);

  const controls = document.createElement("div");
  controls.className = "builder-control-row detachment-control-row";
  controls.append(searchWrap, select, add);
  root.appendChild(controls);
  return root;
}

export { detachmentCandidateRows, detachmentCandidateStatus, renderDetachmentEditor };
