import { state } from "./builder_state.js";
import { unitValidationMessage, validationMessage } from "./builder_validation_messages.js";

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
        messages.push(unitValidationMessage("detachment.datasheet_not_allowed", unit, `${unit.name} is excluded from ${detachment.name}.`, {
          detachmentId: detachment.id,
        }));
      }
    }
    for (const row of state.catalog.detachmentRequiredDatasheetsByDetachmentId.get(detachment.id) || []) {
      const datasheet = state.catalog.datasheetById.get(row.datasheetId);
      if (!counts[row.datasheetId]) {
        messages.push(validationMessage(
          "detachment.datasheets_missing",
          `${detachment.name} requires ${datasheet?.name || "a required unit"}.`,
          "error",
          { detachmentId: detachment.id, datasheetId: row.datasheetId }
        ));
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
      const datasheet = state.catalog.datasheetById.get(linked.datasheetId);
      const actual = counts[linked.datasheetId] || 0;
      if (actual !== linked.count) {
        messages.push(validationMessage(
          "detachment.linked_datasheet_count_mismatch",
          `${detachment.name} requires exactly ${linked.count} ${datasheet?.name || "linked"} unit(s); roster has ${actual}.`,
          "error",
          { datasheetId: linked.datasheetId, detachmentId: detachment.id }
        ));
      }
    }
    for (const unit of units) {
      if (!linkedCounts.has(unit.datasheetId)) {
        messages.push(unitValidationMessage("detachment.linked_datasheet_not_allowed", unit, `${unit.name} is not part of ${detachment.name}.`, {
          detachmentId: detachment.id,
        }));
      }
    }
  }
}

export { validateDetachmentDatasheets };
