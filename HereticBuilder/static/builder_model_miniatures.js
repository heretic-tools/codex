import { state } from "./builder_state.js";

function compositionMiniatures(composition) {
  return state.catalog.compositionMiniaturesByCompositionId.get(composition?.id) || [];
}

function miniaturesForUnit(unit, composition) {
  const saved = Array.isArray(unit.miniatures) ? unit.miniatures : [];
  return saved.map((row) => {
    const miniatureId = row.miniatureId || row.id;
    const miniature = state.catalog.miniatureById.get(miniatureId) || {};
    return {
      rosterUnitMiniatureId: row.rosterUnitMiniatureId || row.id || `${unit.id}:${miniatureId}`,
      miniatureId,
      count: Math.max(0, Number(row.count ?? row.min ?? 0)),
      isWarlord: Boolean(row.isWarlord),
      name: row.name || miniature.name || "Model",
      cannotBeWarlord: Boolean(row.cannotBeWarlord ?? miniature.cannotBeWarlord),
      canBeNonCharacterWarlord: Boolean(row.canBeNonCharacterWarlord ?? miniature.canBeNonCharacterWarlord),
      excludedFromEnhancements: Boolean(row.excludedFromEnhancements ?? miniature.excludedFromEnhancements),
      isSupremeCommander: Boolean(row.isSupremeCommander ?? miniature.isSupremeCommander),
      wargear: row.wargear || {},
    };
  });
}

function compositionLabel(composition) {
  const rows = state.catalog.compositionMiniaturesByCompositionId.get(composition?.id) || [];
  if (!rows.length) {
    return "Composition";
  }
  return rows.map((row) => {
    const count = row.min === row.max ? row.min : `${row.min}-${row.max}`;
    const miniature = state.catalog.miniatureById.get(row.miniatureId);
    return `${count} ${miniature?.name || "model"}`;
  }).join(" + ");
}

export {
  compositionLabel,
  compositionMiniatures,
  miniaturesForUnit,
};
