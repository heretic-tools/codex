import { rosterUnitSummaries } from "./builder_model.js";
import { state } from "./builder_state.js";

function attachmentLabel(attachment, unitsById, index) {
  const bodyguardNames = (attachment.members || [])
    .filter((member) => member.attachmentType === "bodyguard")
    .map((member) => unitsById.get(member.rosterUnitId))
    .filter(Boolean);
  return bodyguardNames.length ? bodyguardNames.join(" + ") : `Attached Unit ${index + 1}`;
}

function validationContextForRoster(roster) {
  const units = rosterUnitSummaries(roster);
  const unitsById = new Map(units.map((unit) => [unit.id, unit.name || "Unit"]));
  const targetsById = new Map();
  for (const unit of units) {
    for (const miniature of unit.miniatures || []) {
      const label = `${unit.name || "Unit"} / ${miniature.name || "Model"}`;
      for (const id of [miniature.rosterUnitMiniatureId, miniature.id, miniature.miniatureId]) {
        if (id && !targetsById.has(id)) {
          targetsById.set(id, label);
        }
      }
    }
  }
  const attachmentsById = new Map((roster.attachments || []).map((attachment, index) => [
    attachment.id,
    attachmentLabel(attachment, unitsById, index),
  ]));
  return {
    attachmentsById,
    datasheetsById: state.catalog.datasheetById,
    detachmentsById: state.catalog.detachmentById,
    targetsById,
    unitsById,
  };
}

export { validationContextForRoster };
