import { state } from "./builder_state.js";
import {
  detachmentDatasheetMissingMessage,
  detachmentDatasheetNotAllowedMessage,
  linkedDatasheetCountMismatchMessage,
  linkedDatasheetNotAllowedMessage,
} from "./builder_detachment_datasheet_messages.js";

function validateDetachmentDatasheets(detachments, units, messages) {
  const counts = {};
  for (const unit of units) {
    counts[unit.datasheetId] = (counts[unit.datasheetId] || 0) + 1;
  }
  for (const detachment of detachments) {
    for (const unit of units) {
      if ((state.catalog.detachmentExcludedDatasheets || []).some((row) => (
        row.detachmentId === detachment.id && row.datasheetId === unit.datasheetId
      ))) {
        messages.push(detachmentDatasheetNotAllowedMessage(detachment, unit));
      }
    }
    for (const row of state.catalog.detachmentRequiredDatasheetsByDetachmentId.get(detachment.id) || []) {
      if (!counts[row.datasheetId]) {
        messages.push(detachmentDatasheetMissingMessage(detachment, row));
      }
    }
    if (!detachment.isCombatPatrol) {
      continue;
    }
    const linkedRows = state.catalog.detachmentLinkedDatasheetsByDetachmentId.get(detachment.id) || [];
    if (!linkedRows.length) {
      continue;
    }
    const linkedCounts = new Map(linkedRows.map((row) => [row.datasheetId, row.count]));
    for (const linked of linkedRows) {
      const actual = counts[linked.datasheetId] || 0;
      if (actual !== linked.count) {
        messages.push(linkedDatasheetCountMismatchMessage(detachment, linked, actual));
      }
    }
    for (const unit of units) {
      if (!linkedCounts.has(unit.datasheetId)) {
        messages.push(linkedDatasheetNotAllowedMessage(detachment, unit));
      }
    }
  }
}

export { validateDetachmentDatasheets };
