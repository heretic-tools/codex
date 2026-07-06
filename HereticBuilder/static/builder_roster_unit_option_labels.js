import {
  compositionFactionIds,
  defaultComposition,
} from "./builder_model.js";

function unitOptionLabel(roster, allyType, datasheet) {
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []);
  const points = composition ? `${composition.points || 0} pts` : "no composition";
  return `${datasheet.name} (${points})`;
}

function unitOptionText(roster, allyType, datasheet, status) {
  const label = unitOptionLabel(roster, allyType, datasheet);
  return status.reason ? `${label} / ${status.reason}` : label;
}

export { unitOptionText };
