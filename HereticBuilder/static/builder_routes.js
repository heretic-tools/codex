import { siteHref } from "./builder_state.js";

function parseRoute() {
  const parts = (window.location.hash.replace(/^#/, "") || "/").split("/").filter(Boolean);
  if (parts[0] === "new") {
    return { name: "create", rosterId: "" };
  }
  if (parts[0] === "roster" && parts[1]) {
    if (parts[2] === "unit" && parts[3]) {
      return {
        name: "unit",
        rosterId: decodeURIComponent(parts[1]),
        unitId: decodeURIComponent(parts[3]),
      };
    }
    return { name: "roster", rosterId: decodeURIComponent(parts[1]) };
  }
  return { name: "list", rosterId: "" };
}

function navigate(path) {
  window.location.hash = path;
}

function baseBreadcrumbs() {
  return [{ label: "HereticTools", href: siteHref("/") }];
}

function builderHref(hashPath = "/") {
  return `${siteHref("/")}${hashPath.startsWith("#") ? hashPath : `#${hashPath}`}`;
}

function builderBreadcrumbs() {
  return [...baseBreadcrumbs(), { label: "Builder", href: builderHref("/") }];
}

export { baseBreadcrumbs, builderBreadcrumbs, builderHref, navigate, parseRoute };
