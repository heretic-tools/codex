import { siteHref } from "./builder_state.js";

async function fetchJson(path) {
  const response = await fetch(siteHref(path), { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`${path}: ${response.status}`);
  }
  return response.json();
}

async function loadTable(name) {
  const payload = await fetchJson(`/builder-data/tables/${name}.json`);
  return payload.rows || [];
}

async function loadCatalogTables(tableDefinitions) {
  const rows = await Promise.all(tableDefinitions.map(([, tableName]) => loadTable(tableName)));
  return Object.fromEntries(tableDefinitions.map(([key], index) => [key, rows[index]]));
}

export { fetchJson, loadCatalogTables };
