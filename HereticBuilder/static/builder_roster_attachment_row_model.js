import { validationForAttachment } from "./builder_validation_view.js";

function attachmentMembersForRow(attachment, unitsById) {
  return [
    ...(attachment.members || []).filter((member) => member.attachmentType === "bodyguard"),
    ...(attachment.members || []).filter((member) => member.attachmentType === "leader" || member.attachmentType === "support"),
  ]
    .map((member) => ({
      ...member,
      unit: unitsById.get(member.rosterUnitId),
    }))
    .filter((member) => member.unit);
}

function attachmentValidationStatus(validation, attachment, unitsById) {
  const messages = validationForAttachment(validation, attachment, unitsById).messages || [];
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

function attachmentTitle(members, index) {
  const bodyguardNames = members
    .filter((member) => member.attachmentType === "bodyguard")
    .map((member) => member.unit.name || "Bodyguard");
  return bodyguardNames.length ? bodyguardNames.join(" + ") : `Attached Unit ${index + 1}`;
}

export {
  attachmentMembersForRow,
  attachmentTitle,
  attachmentValidationStatus,
};
