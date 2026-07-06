import {
  availableCompositions,
  compositionFactionIds,
  compositionLabel,
} from "./builder_model.js";

function compositionSelectModel(roster, unit) {
  const factionIds = compositionFactionIds(roster, unit.allyType || "native");
  const compositions = availableCompositions(unit.datasheetId, factionIds, roster.detachmentIds || []);
  return {
    currentId: unit.compositionId || compositions[0]?.id || "",
    options: compositions.map((composition) => ({
      label: `${compositionLabel(composition)} (${composition.points || 0} pts)`,
      value: composition.id,
    })),
  };
}

export { compositionSelectModel };
