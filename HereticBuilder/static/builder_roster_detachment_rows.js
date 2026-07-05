import { textNode } from "./builder_dom.js";
import { detachmentCodexHref } from "./builder_codex_links.js";
import {
  availableDetachments,
  costForDetachment,
  detachmentDispositionName,
} from "./builder_model.js";
import { rosterWithRemovedDetachment } from "./builder_roster_actions.js";
import {
  dispositionSlug,
  removeButton,
} from "./builder_roster_editor_dom.js";
import { state } from "./builder_state.js";
import { validationForDetachment } from "./builder_validation_view.js";

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

export { renderDetachmentRow };
