function validationMessage(code, text, level = "error") {
  return { level, code, text };
}

function validationWarning(code, text) {
  return validationMessage(code, text, "warning");
}

export { validationMessage, validationWarning };
