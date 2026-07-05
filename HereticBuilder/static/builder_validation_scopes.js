function validationState(messages) {
  return messages.some((message) => message.level === "error") ? "invalid" : "valid";
}

function validationWithMessages(validation, messages) {
  return {
    ...validation,
    state: validationState(messages),
    messages,
  };
}

function validationMessageMatchesUnit(message, unit) {
  const scope = message.scope || {};
  const targetIds = new Set((unit.miniatures || []).flatMap((miniature) => [
    miniature.rosterUnitMiniatureId,
    miniature.id,
    miniature.miniatureId,
  ]).filter(Boolean));
  return scope.unitId === unit.id
    || (scope.unitIds || []).includes(unit.id)
    || scope.datasheetId === unit.datasheetId
    || (scope.datasheetIds || []).includes(unit.datasheetId)
    || targetIds.has(scope.targetId)
    || (scope.targetIds || []).some((targetId) => targetIds.has(targetId));
}

function validationForUnit(validation, unit) {
  return validationWithMessages(
    validation,
    (validation.messages || []).filter((message) => validationMessageMatchesUnit(message, unit))
  );
}

function validationMessageMatchesDetachment(message, detachmentId) {
  const scope = message.scope || {};
  return scope.detachmentId === detachmentId
    || (scope.detachmentIds || []).includes(detachmentId);
}

function validationForDetachment(validation, detachmentId) {
  return validationWithMessages(
    validation,
    (validation.messages || []).filter((message) => validationMessageMatchesDetachment(message, detachmentId))
  );
}

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

function validationForAttachment(validation, attachment, unitsById = null) {
  return validationWithMessages(
    validation,
    (validation.messages || []).filter((message) => validationMessageMatchesAttachment(message, attachment, unitsById))
  );
}

function validationMessageMatchesTarget(message, targetId) {
  const scope = message.scope || {};
  return Boolean(targetId) && (
    scope.targetId === targetId || (scope.targetIds || []).includes(targetId)
  );
}

function validationForTarget(validation, targetId) {
  return validationWithMessages(
    validation,
    (validation.messages || []).filter((message) => validationMessageMatchesTarget(message, targetId))
  );
}

export {
  validationForAttachment,
  validationForDetachment,
  validationForTarget,
  validationForUnit,
};
