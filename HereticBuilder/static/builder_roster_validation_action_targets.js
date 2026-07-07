import { rosterValidationCodeActionTarget } from "./builder_roster_validation_code_action_targets.js";
import { unitValidationActionTarget } from "./builder_roster_unit_validation_targets.js";

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
  if (String(group.code || "").startsWith("attached_unit.")) {
    if (attachmentIds.length === 1) {
      return { attribute: "attachment-id", kind: "row", text: "Show", value: attachmentIds[0] };
    }
    if (attachmentIds.length > 1) {
      return { kind: "target", target: "attachments", text: "Attached" };
    }
  }
  if (unitIds.length === 1) {
    const unitTarget = unitValidationActionTarget(group);
    return {
      focusTarget: unitTarget?.target || "",
      kind: "unit",
      text: "Open Unit",
      unitId: unitIds[0],
    };
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

export { rosterValidationActionTarget };
