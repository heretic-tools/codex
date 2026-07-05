function attachmentTargetIds(attachment, unitsById = null) {
  if (!unitsById) {
    return new Set();
  }
  const targetIds = [];
  for (const member of attachment.members || []) {
    const unit = unitsById.get?.(member.rosterUnitId);
    for (const miniature of unit?.miniatures || []) {
      targetIds.push(miniature.rosterUnitMiniatureId, miniature.id, miniature.miniatureId);
    }
  }
  return new Set(targetIds.filter(Boolean));
}

function validationMessageMatchesAttachment(message, attachment, unitsById = null) {
  const scope = message.scope || {};
  const memberIds = new Set((attachment.members || []).map((member) => member.rosterUnitId).filter(Boolean));
  const targetIds = attachmentTargetIds(attachment, unitsById);
  return scope.attachmentId === attachment.id
    || (scope.attachmentIds || []).includes(attachment.id)
    || memberIds.has(scope.unitId)
    || (scope.unitIds || []).some((unitId) => memberIds.has(unitId))
    || targetIds.has(scope.targetId)
    || (scope.targetIds || []).some((targetId) => targetIds.has(targetId));
}

export { validationMessageMatchesAttachment };
