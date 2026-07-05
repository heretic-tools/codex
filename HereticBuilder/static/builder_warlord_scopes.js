import { state } from "./builder_state.js";

function selectedWarlordUnits(units) {
  return units.filter((unit) => (unit.warlordMiniatureIds || []).length);
}

function targetIdForMiniature(miniature) {
  return miniature?.rosterUnitMiniatureId || miniature?.id || miniature?.miniatureId || "";
}

function warlordTargetIds(unit) {
  const warlordIds = new Set(unit.warlordMiniatureIds || []);
  return (unit.miniatures || [])
    .filter((miniature) => miniature.isWarlord || warlordIds.has(miniature.miniatureId))
    .map(targetIdForMiniature)
    .filter(Boolean);
}

function unitScope(units) {
  const unitIds = [...new Set(units.map((unit) => unit.id).filter(Boolean))];
  const datasheetIds = [...new Set(units.map((unit) => unit.datasheetId).filter(Boolean))];
  const targetIds = [...new Set(units.flatMap(warlordTargetIds))];
  return {
    unitIds,
    datasheetIds,
    targetIds,
  };
}

function unitsWithMiniature(units, miniatureId) {
  return units.filter((unit) => (
    (unit.miniatures || []).some((miniature) => miniature.miniatureId === miniatureId && miniature.count > 0)
  ));
}

function mandatoryWarlordMissingScope(mandatoryWarlordId) {
  const datasheetId = state.catalog.miniatureById.get(mandatoryWarlordId)?.datasheetId || "";
  return datasheetId ? { datasheetId } : null;
}

export {
  mandatoryWarlordMissingScope,
  selectedWarlordUnits,
  unitScope,
  unitsWithMiniature,
};
