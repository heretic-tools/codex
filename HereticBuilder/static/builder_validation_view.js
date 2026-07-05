import { textNode } from "./builder_dom.js";

function validationCounts(messages) {
  return messages.reduce((counts, message) => {
    counts[message.level] = (counts[message.level] || 0) + 1;
    return counts;
  }, {});
}

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

function validationSummary(validation) {
  if (!validation.messages.length) {
    return "Valid";
  }
  const counts = validationCounts(validation.messages);
  const parts = [];
  if (counts.error) {
    parts.push(`${counts.error} error${counts.error === 1 ? "" : "s"}`);
  }
  if (counts.warning) {
    parts.push(`${counts.warning} warning${counts.warning === 1 ? "" : "s"}`);
  }
  return `${validation.state === "valid" ? "Valid" : "Invalid"} / ${parts.join(" / ")}`;
}

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
    for (const attachmentId of [message.scope?.attachmentId, ...(message.scope?.attachmentIds || [])]) {
      if (attachmentId && !group.attachmentIds.includes(attachmentId)) {
        group.attachmentIds.push(attachmentId);
      }
    }
    for (const detachmentId of [message.scope?.detachmentId, ...(message.scope?.detachmentIds || [])]) {
      if (detachmentId && !group.detachmentIds.includes(detachmentId)) {
        group.detachmentIds.push(detachmentId);
      }
    }
    for (const datasheetId of [message.scope?.datasheetId, ...(message.scope?.datasheetIds || [])]) {
      if (datasheetId && !group.datasheetIds.includes(datasheetId)) {
        group.datasheetIds.push(datasheetId);
      }
    }
    for (const targetId of [message.scope?.targetId, ...(message.scope?.targetIds || [])]) {
      if (targetId && !group.targetIds.includes(targetId)) {
        group.targetIds.push(targetId);
      }
    }
    for (const unitId of [message.scope?.unitId, ...(message.scope?.unitIds || [])]) {
      if (unitId && !group.unitIds.includes(unitId)) {
        group.unitIds.push(unitId);
      }
    }
    for (const label of validationScopeLabels(message, context)) {
      if (!group.scopeLabels.includes(label)) {
        group.scopeLabels.push(label);
      }
    }
    if (!group.texts.includes(message.text)) {
      group.texts.push(message.text);
    }
  }
  return [...groups.values()].sort((left, right) => (
    left.level.localeCompare(right.level) || left.code.localeCompare(right.code)
  ));
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

function appendGroupedMessages(list, messages, context = {}, groupAction = null) {
  for (const group of groupedMessages(messages, context)) {
    const item = textNode("div", `validation-item ${group.level}`, "");
    const head = document.createElement("div");
    head.className = "validation-row-head";
    const action = groupAction?.(group);
    head.append(
      textNode("strong", "", group.code),
      textNode("span", "validation-count", String(group.count))
    );
    if (action) {
      head.appendChild(action);
    }
    item.appendChild(head);
    if (group.scopeLabels.length) {
      const scopes = document.createElement("div");
      scopes.className = "validation-scope-row";
      for (const label of group.scopeLabels) {
        scopes.appendChild(textNode("span", "meta-badge", label));
      }
      item.appendChild(scopes);
    }
    for (const text of group.texts) {
      item.appendChild(textNode("p", "", text));
    }
    list.appendChild(item);
  }
}

function renderValidationMessages(messages, { context = {}, groupAction = null } = {}) {
  const list = document.createElement("div");
  list.className = "validation-list validation-list-compact";
  appendGroupedMessages(list, messages, context, groupAction);
  return list;
}

function renderValidation(validation, { context = {}, groupAction = null, title = "Validation" } = {}) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section";
  wrap.appendChild(textNode("h2", "section-title", title));
  const list = document.createElement("div");
  list.className = "validation-list";
  list.appendChild(textNode(
    "div",
    `validation-item validation-summary ${validation.messages.some((message) => message.level === "error") ? "error" : "ok"}`,
    validationSummary(validation)
  ));
  appendGroupedMessages(list, validation.messages, context, groupAction);
  wrap.appendChild(list);
  return wrap;
}

export {
  groupedMessages,
  renderValidation,
  renderValidationMessages,
  validationScopeLabels,
  validationForAttachment,
  validationForDetachment,
  validationForTarget,
  validationForUnit,
};
