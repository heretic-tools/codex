import { clear, link, textNode } from "./builder_dom.js";

const el = {
  breadcrumbs: document.getElementById("builder-breadcrumbs"),
  root: document.getElementById("builder-root"),
  status: document.getElementById("data-status"),
  title: document.getElementById("builder-page-title"),
};

function setStatus(text) {
  el.status.textContent = text;
}

function renderBreadcrumbs(items) {
  clear(el.breadcrumbs);
  items.forEach((item, index) => {
    if (index) {
      el.breadcrumbs.appendChild(textNode("span", "breadcrumb-separator", "/"));
    }
    el.breadcrumbs.appendChild(link("breadcrumb-menu-item", item.label, item.href));
  });
}

function renderStartupError(error) {
  setStatus("Error");
  clear(el.root);
  el.root.appendChild(textNode("div", "validation-item error", error.message || "Failed to start"));
}

export { el, renderBreadcrumbs, renderStartupError, setStatus };
