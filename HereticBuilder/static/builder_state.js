export const state = {
  db: null,
  catalog: null,
  rosters: [],
  route: { name: "list", rosterId: "" },
};

function normalizeBasePath(value) {
  const path = String(value || "").trim().replace(/\/+$/, "");
  return path && path !== "/" ? `/${path.replace(/^\/+/, "")}` : "";
}

const basePath = normalizeBasePath(
  typeof document === "undefined"
    ? ""
    : document.querySelector('meta[name="heretic-base-path"]')?.content || ""
);

export function siteHref(path) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return path;
  }
  return `${basePath}${path}`;
}
