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

function documentTitleFor(pageTitle) {
  const title = String(pageTitle || "Builder").trim() || "Builder";
  return title === "Builder" ? "Heretic Builder" : `${title} | Heretic Builder`;
}

function setPageTitle(title) {
  const pageTitle = String(title || "Builder").trim() || "Builder";
  el.title.textContent = pageTitle;
  document.title = documentTitleFor(pageTitle);
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
  setPageTitle("Builder Error");
  setStatus("Error");
  clear(el.root);
  el.root.appendChild(textNode("div", "validation-item error", error.message || "Failed to start"));
}

export { documentTitleFor, el, renderBreadcrumbs, renderStartupError, setPageTitle, setStatus };
