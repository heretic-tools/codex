import { unique } from "./builder_model.js";

function formatAttachmentList(values) {
  const allNames = unique(values);
  const names = allNames.slice(0, 5);
  if (!names.length) {
    return "";
  }
  const suffix = allNames.length > names.length ? `, +${allNames.length - names.length} more` : "";
  if (names.length === 1) {
    return `${names[0]}${suffix}`;
  }
  if (names.length === 2) {
    return `${names[0]} or ${names[1]}${suffix}`;
  }
  return `${names.slice(0, -1).join(", ")}, or ${names[names.length - 1]}${suffix}`;
}

export { formatAttachmentList };
