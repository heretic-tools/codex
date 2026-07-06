import { siteHref } from "./builder_state.js";

function parseRoute() {
  const parts = (window.location.hash.replace(/^#/, "") || "/").split("/").filter(Boolean);
  if (parts[0] === "new") {
    return { focusTarget: "", name: "create", rosterId: "" };
  }
  if (parts[0] === "roster" && parts[1]) {
    if (parts[2] === "unit" && parts[3]) {
      return {
        focusTarget: parts[4] === "focus" && parts[5] ? decodeURIComponent(parts[5]) : "",
        name: "unit",
        rosterId: decodeURIComponent(parts[1]),
        unitId: decodeURIComponent(parts[3]),
      };
    }
    return { focusTarget: "", name: "roster", rosterId: decodeURIComponent(parts[1]) };
  }
  return { focusTarget: "", name: "list", rosterId: "" };
}

function navigate(path) {
  window.location.hash = path;
}

function baseBreadcrumbs() {
  return [{ label: "HereticTools", href: "/" }];
}

function builderHref(hashPath = "/") {
  return `${siteHref("/")}${hashPath.startsWith("#") ? hashPath : `#${hashPath}`}`;
}

function builderBreadcrumbs() {
  return [...baseBreadcrumbs(), { label: "Builder", href: builderHref("/") }];
}

function rosterBreadcrumbs(roster) {
  return [
    ...builderBreadcrumbs(),
    {
      label: roster?.name || "New Roster",
      href: builderHref(`/roster/${encodeURIComponent(roster?.id || "")}`),
    },
  ];
}

export { baseBreadcrumbs, builderBreadcrumbs, builderHref, navigate, parseRoute, rosterBreadcrumbs };
