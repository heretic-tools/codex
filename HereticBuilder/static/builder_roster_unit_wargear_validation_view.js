import { renderValidationMessages, validationForTarget } from "./builder_validation_view.js";

function isWargearMessage(message) {
  return String(message.code || "").startsWith("wargear_loadout.");
}

function validationWithMessages(validation, messages) {
  return {
    ...validation,
    state: messages.some((message) => message.level === "error") ? "invalid" : "valid",
    messages,
  };
}

function validationForWargearScope(validation, targetId = "") {
  const messages = targetId
    ? validationForTarget(validation, targetId).messages.filter(isWargearMessage)
    : (validation.messages || []).filter((message) => (
      isWargearMessage(message)
      && !(message.scope?.targetId)
      && !(message.scope?.targetIds || []).length
    ));
  return validationWithMessages(validation, messages);
}

function renderScopeValidation(validation, context) {
  if (!validation.messages.length) {
    return null;
  }
  const wrap = document.createElement("div");
  wrap.className = "scope-validation";
  wrap.appendChild(renderValidationMessages(validation.messages, { context }));
  return wrap;
}

function targetIdForWargearScope(target) {
  return target.rosterUnitMiniatureId || (target.miniatureId ? target.id || target.miniatureId : "");
}

export {
  renderScopeValidation,
  targetIdForWargearScope,
  validationForWargearScope,
};
