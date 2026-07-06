import { formatAttachmentList } from "./builder_roster_attachment_list_format.js";

function namesForFailures(failures, type) {
  return failures
    .filter((failure) => failure.type === type)
    .map((failure) => failure.name);
}

function attachmentFailureMessage(failures) {
  const sharedKeywords = namesForFailures(failures, "shared-keyword");
  if (sharedKeywords.length) {
    return `No valid attached units: requires both units to share ${formatAttachmentList(sharedKeywords)}.`;
  }
  const requiredDetachments = namesForFailures(failures, "required-detachment");
  if (requiredDetachments.length) {
    return `No valid attached units: requires ${formatAttachmentList(requiredDetachments)}.`;
  }
  const excludedDetachments = namesForFailures(failures, "excluded-detachment");
  if (excludedDetachments.length) {
    return `No valid attached units: blocked by ${formatAttachmentList(excludedDetachments)}.`;
  }
  const factionNames = namesForFailures(failures, "faction");
  if (factionNames.length) {
    return `No valid attached units: requires ${formatAttachmentList(factionNames)}.`;
  }
  const bodyguardKeywords = namesForFailures(failures, "bodyguard-keyword");
  if (bodyguardKeywords.length) {
    return `No valid attached units: bodyguard needs ${formatAttachmentList(bodyguardKeywords)}.`;
  }
  if (failures.some((failure) => failure.type === "bodyguard-datasheet")) {
    return "No valid attached units: bodyguard datasheet is not allowed.";
  }
  return "No valid attached units";
}

export { attachmentFailureMessage };
