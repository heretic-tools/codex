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
import { detachmentValidationStatus } from "./builder_roster_detachment_validation_status.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { state } from "./builder_state.js";

function removeDetachmentFromRow(roster, detachment, index, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: `${detachment?.name || "Detachment"} removed`,
    nextRoster: rosterWithRemovedDetachment(roster, index),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function renderDetachmentRow(roster, detachmentId, index, validation, onUpdate, onUndoableUpdate = null) {
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
    text.title = `Open Codex detachment: ${detachment?.name || "Detachment"}`;
    text.setAttribute("aria-label", text.title);
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
    removeButton("Remove detachment", async () => (
      removeDetachmentFromRow(roster, detachment, index, onUpdate, onUndoableUpdate)
    ))
  );
  row.append(text, meta);
  return row;
}

export { removeDetachmentFromRow, renderDetachmentRow };
