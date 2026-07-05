function scrollToEditorRow(attributeName, value) {
  const selectorValue = window.CSS?.escape ? CSS.escape(value) : String(value).replace(/"/g, "");
  const datasetName = attributeName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const row = document.querySelector(`[data-${attributeName}="${selectorValue}"]`)
    || [...document.querySelectorAll(`[data-${attributeName}]`)].find((node) => node.dataset[datasetName] === value);
  scrollToElement(row);
}

function scrollToEditorTarget(target) {
  const selectorValue = window.CSS?.escape ? CSS.escape(target) : String(target).replace(/"/g, "");
  scrollToElement(document.querySelector(`[data-editor-target="${selectorValue}"]`));
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

function scrollToElement(node) {
  if (!node) {
    return;
  }
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusTarget = node.querySelector("[data-focus-target]")
    || (node.matches("button, input, select, textarea, a")
      ? node
      : node.querySelector("button, input, select, textarea, a"));
  focusTarget?.focus({ preventScroll: true });
  node.classList.add("is-attention-target");
  window.setTimeout(() => node.classList.remove("is-attention-target"), 900);
}

export {
  scrollToEditorRow,
  scrollToEditorTarget,
  scrollToUnitSearch,
};
