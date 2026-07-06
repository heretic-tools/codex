function currentCount(target, optionId) {
  return Number((target.wargear || {})[optionId] || 0);
}

function countControl({ onChange, optionRow, target }) {
  if (optionRow.inputType === "checkbox") {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = currentCount(target, optionRow.id) > 0;
    input.dataset.focusTarget = "true";
    input.addEventListener("change", () => onChange(input.checked ? 1 : 0));
    return input;
  }
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = String(currentCount(target, optionRow.id));
  input.dataset.focusTarget = "true";
  input.addEventListener("change", () => onChange(input.value));
  return input;
}

export { countControl, currentCount };
