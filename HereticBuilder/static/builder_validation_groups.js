function labelFromMap(map, id, fallback) {
  const value = map?.get?.(id);
  if (typeof value === "string") {
    return value;
  }
  return value?.name || fallback;
}

function pushScopeLabels(labels, prefix, ids, map, fallback) {
  for (const id of ids || []) {
    if (!id) {
      continue;
    }
    const label = `${prefix}: ${labelFromMap(map, id, fallback)}`;
    if (!labels.includes(label)) {
      labels.push(label);
    }
  }
}

function validationScopeLabels(message, context = {}) {
  const scope = message.scope || {};
  const labels = [];
  pushScopeLabels(labels, "Unit", [
    scope.unitId,
    ...(scope.unitIds || []),
  ], context.unitsById, "unit");
  pushScopeLabels(labels, "Model", [
    scope.targetId,
    ...(scope.targetIds || []),
  ], context.targetsById, "model");
  pushScopeLabels(labels, "Detachment", [
    scope.detachmentId,
    ...(scope.detachmentIds || []),
  ], context.detachmentsById, "detachment");
  pushScopeLabels(labels, "Attached", [
    scope.attachmentId,
    ...(scope.attachmentIds || []),
  ], context.attachmentsById, "attached unit");
  pushScopeLabels(labels, "Datasheet", [
    scope.datasheetId,
    ...(scope.datasheetIds || []),
  ], context.datasheetsById, "datasheet");
  return labels.slice(0, 8);
}

function appendUnique(values, source) {
  for (const value of source || []) {
    if (value && !values.includes(value)) {
      values.push(value);
    }
  }
}

function groupedMessages(messages, context = {}) {
  const groups = new Map();
  for (const message of messages) {
    const key = `${message.level || "error"}:${message.code || "unknown"}`;
    if (!groups.has(key)) {
      groups.set(key, {
        code: message.code || "unknown",
        level: message.level || "error",
        count: 0,
        scopeLabels: [],
        texts: [],
        attachmentIds: [],
        datasheetIds: [],
        detachmentIds: [],
        targetIds: [],
        unitIds: [],
      });
    }
    const group = groups.get(key);
    group.count += 1;
    appendUnique(group.attachmentIds, [message.scope?.attachmentId, ...(message.scope?.attachmentIds || [])]);
    appendUnique(group.detachmentIds, [message.scope?.detachmentId, ...(message.scope?.detachmentIds || [])]);
    appendUnique(group.datasheetIds, [message.scope?.datasheetId, ...(message.scope?.datasheetIds || [])]);
    appendUnique(group.targetIds, [message.scope?.targetId, ...(message.scope?.targetIds || [])]);
    appendUnique(group.unitIds, [message.scope?.unitId, ...(message.scope?.unitIds || [])]);
    appendUnique(group.scopeLabels, validationScopeLabels(message, context));
    appendUnique(group.texts, [message.text]);
  }
  return [...groups.values()].sort((left, right) => (
    left.level.localeCompare(right.level) || left.code.localeCompare(right.code)
  ));
}

export {
  groupedMessages,
  validationScopeLabels,
};
