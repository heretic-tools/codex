function validationUnitTargetIds(unit) {
  return new Set((unit.miniatures || []).flatMap((miniature) => [
    miniature.rosterUnitMiniatureId,
    miniature.id,
    miniature.miniatureId,
  ]).filter(Boolean));
}

function validationMessageMatchesUnit(message, unit) {
  const scope = message.scope || {};
  const targetIds = validationUnitTargetIds(unit);
  return scope.unitId === unit.id
    || (scope.unitIds || []).includes(unit.id)
    || scope.datasheetId === unit.datasheetId
    || (scope.datasheetIds || []).includes(unit.datasheetId)
    || targetIds.has(scope.targetId)
    || (scope.targetIds || []).some((targetId) => targetIds.has(targetId));
}

export { validationMessageMatchesUnit };
