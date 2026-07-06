function validationMessageMatchesTarget(message, targetId) {
  const scope = message.scope || {};
  return Boolean(targetId) && (
    scope.targetId === targetId || (scope.targetIds || []).includes(targetId)
  );
}

export { validationMessageMatchesTarget };
