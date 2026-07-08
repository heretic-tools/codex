import { clear, link, textNode } from "./builder_dom.js";

const el = {
  breadcrumbs: document.getElementById("builder-breadcrumbs"),
  header: document.getElementById("builder-app-header"),
  root: document.getElementById("builder-root"),
  status: document.getElementById("data-status"),
  title: document.getElementById("builder-page-title"),
};

const pageHeroClasses = [
  "has-background-art",
  "has-roster-hero",
  "has-faction-image",
  "has-unit-image",
];

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

function removeClasses(node, classNames) {
  if (!node) {
    return;
  }
  if (node.classList?.remove) {
    node.classList.remove(...classNames);
    return;
  }
  const remove = new Set(classNames);
  node.className = String(node.className || "")
    .split(/\s+/)
    .filter((className) => className && !remove.has(className))
    .join(" ");
}

function clearPageHero() {
  removeClasses(el.header, pageHeroClasses);
  if (el.header?.style?.removeProperty) {
    el.header.style.removeProperty("--background-art");
  } else {
    el.header?.removeAttribute?.("style");
  }
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
  clearPageHero();
  setPageTitle("Builder Error");
  setStatus("Error");
  clear(el.root);
  el.root.appendChild(textNode("div", "validation-item error", error.message || "Failed to start"));
}

export { clearPageHero, documentTitleFor, el, renderBreadcrumbs, renderStartupError, setPageTitle, setStatus };
