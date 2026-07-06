function validationMessageMatchesDetachment(message, detachmentId) {
  const scope = message.scope || {};
  return scope.detachmentId === detachmentId
    || (scope.detachmentIds || []).includes(detachmentId);
}

export { validationMessageMatchesDetachment };
