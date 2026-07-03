function cleanScope(scope) {
  return Object.fromEntries(
    Object.entries(scope || {}).filter(([, value]) => (
      value != null && value !== "" && !(Array.isArray(value) && !value.length)
    ))
  );
}

function validationMessage(code, text, level = "error", scope = null) {
  const clean = cleanScope(scope);
  return Object.keys(clean).length
    ? { level, code, text, scope: clean }
    : { level, code, text };
}

function unitValidationMessage(code, unit, text, scope = {}, level = "error") {
  return validationMessage(code, text, level, {
    ...scope,
    unitId: unit?.id,
    datasheetId: unit?.datasheetId,
  });
}

function validationWarning(code, text, scope = null) {
  return validationMessage(code, text, "warning", scope);
}

export { unitValidationMessage, validationMessage, validationWarning };
