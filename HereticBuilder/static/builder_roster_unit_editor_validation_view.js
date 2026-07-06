import { renderValidationMessages, validationForTarget } from "./builder_validation_view.js";

function messageHasTargetScope(message) {
  return Boolean(message.scope?.targetId || (message.scope?.targetIds || []).length);
}

function messageMatchesUnitEditor(message, editor) {
  const code = String(message.code || "");
  if (editor === "allegiance") {
    return code.startsWith("allegiance_ability.");
  }
  if (editor === "composition") {
    return code.startsWith("unit_composition.") || code === "unit.max_model_count_too_many_models";
  }
  if (editor === "enhancements") {
    return code.startsWith("enhancement.") || code === "warlord.invalid_due_to_enhancement";
  }
  if (editor === "warlord") {
    return code !== "warlord.invalid_due_to_enhancement"
      && (code.startsWith("warlord.") || code.startsWith("mandatory_warlord."));
  }
  return false;
}

function editorMessages(validation, editor, targetId = "") {
  if (!validation) {
    return [];
  }
  const sourceMessages = targetId
    ? validationForTarget(validation, targetId).messages
    : (validation?.messages || []).filter((message) => (
      editor !== "enhancements" || !messageHasTargetScope(message)
    ));
  return sourceMessages.filter((message) => messageMatchesUnitEditor(message, editor));
}

function validationForUnitEditor(validation, editor, targetId = "") {
  const messages = editorMessages(validation, editor, targetId);
  return {
    ...(validation || {}),
    messages,
    state: messages.some((message) => message.level === "error") ? "invalid" : "valid",
  };
}

function renderUnitEditorValidation(validation, context, editor, targetId = "") {
  const scopedValidation = validationForUnitEditor(validation, editor, targetId);
  if (!scopedValidation.messages.length) {
    return null;
  }
  const wrap = document.createElement("div");
  wrap.className = "scope-validation unit-editor-validation";
  wrap.appendChild(renderValidationMessages(scopedValidation.messages, { context }));
  return wrap;
}

export {
  editorMessages,
  messageMatchesUnitEditor,
  renderUnitEditorValidation,
  validationForUnitEditor,
};
