function scrollToEditorRow(attributeName, value) {
  const selectorValue = window.CSS?.escape ? CSS.escape(value) : String(value).replace(/"/g, "");
  const datasetName = attributeName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const row = document.querySelector(`[data-${attributeName}="${selectorValue}"]`)
    || [...document.querySelectorAll(`[data-${attributeName}]`)].find((node) => node.dataset[datasetName] === value);
  scrollToElement(row);
}

function editorTargetNode(target) {
  const selectorValue = window.CSS?.escape ? CSS.escape(target) : String(target).replace(/"/g, "");
  return document.querySelector(`[data-editor-target="${selectorValue}"]`);
}

function scrollToEditorTarget(target) {
  scrollToElement(editorTargetNode(target));
}

function triggerEditorTargetPrimaryAction(target) {
  const node = editorTargetNode(target);
  const action = node?.querySelector("[data-editor-primary-action]");
  if (!action || action.disabled || typeof action.click !== "function") {
    scrollToElement(node);
    return false;
  }
  action.click();
  return true;
}

function scrollToUnitSearch(query = "") {
  const unitSection = document.querySelector('[data-editor-target="units"]');
  const search = unitSection?.querySelector("[data-focus-target]");
  if (search && query && "value" in search) {
    search.value = query;
    search.dispatchEvent(new Event("input", { bubbles: true }));
  }
  scrollToElement(unitSection);
}

function expandDisclosure(node) {
  const disclosure = node.matches?.("details:not([open])")
    ? node
    : node.querySelector?.("details:not([open])");
  if (disclosure) {
    disclosure.open = true;
  }
  return disclosure || null;
}

function scrollToElement(node) {
  if (!node) {
    return;
  }
  expandDisclosure(node);
  const focusTarget = node.querySelector("[data-focus-target]")
    || (node.matches("button, input, select, textarea, a")
      ? node
      : node.querySelector("button, input, select, textarea, a"));
  const scrollTarget = focusTarget || node;
  scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
  focusTarget?.focus({ preventScroll: true });
  node.classList.add("is-attention-target");
  window.setTimeout(() => node.classList.remove("is-attention-target"), 900);
}

export {
  expandDisclosure,
  scrollToEditorRow,
  scrollToEditorTarget,
  scrollToUnitSearch,
  triggerEditorTargetPrimaryAction,
};
