function currentCount(target, optionId) {
  return Number((target.wargear || {})[optionId] || 0);
}

function normalizedCount(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

function stepperButton(className, text, label, onClick) {
  const node = document.createElement("button");
  node.className = className;
  node.type = "button";
  node.textContent = text;
  node.title = label;
  node.setAttribute("aria-label", label);
  node.addEventListener("click", onClick);
  return node;
}

function countControl({ label = "Wargear", onChange, optionRow, target }) {
  if (optionRow.inputType === "checkbox") {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = currentCount(target, optionRow.id) > 0;
    input.dataset.focusTarget = "true";
    input.title = label;
    input.setAttribute("aria-label", label);
    input.addEventListener("change", () => onChange(input.checked ? 1 : 0));
    return input;
  }
  const wrap = document.createElement("div");
  wrap.className = "wargear-count-stepper";
  const input = document.createElement("input");
  input.className = "wargear-count-input";
  input.inputMode = "numeric";
  input.pattern = "[0-9]*";
  input.setAttribute("inputmode", "numeric");
  input.setAttribute("pattern", "[0-9]*");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = String(currentCount(target, optionRow.id));
  input.dataset.focusTarget = "true";
  input.title = label;
  input.setAttribute("aria-label", label);
  const commit = (value) => {
    const next = normalizedCount(value);
    input.value = String(next);
    decrement.disabled = next <= 0;
    return onChange(next);
  };
  const decrement = stepperButton(
    "wargear-count-button",
    "-",
    `Decrease ${label}`,
    () => commit(Number(input.value || 0) - 1)
  );
  const increment = stepperButton(
    "wargear-count-button",
    "+",
    `Increase ${label}`,
    () => commit(Number(input.value || 0) + 1)
  );
  decrement.disabled = normalizedCount(input.value) <= 0;
  input.addEventListener("change", () => commit(input.value));
  wrap.append(decrement, input, increment);
  return wrap;
}

export { countControl, currentCount, normalizedCount };
