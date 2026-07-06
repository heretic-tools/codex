import { siteHref } from "./builder_state.js";

let manifestPromise = null;

async function fetchJson(path) {
  const response = await fetch(siteHref(path), { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`${path}: ${response.status}`);
  }
  return response.json();
}

function builderDataPath(manifest, logicalPath) {
  const files = manifest?.files || [];
  const entry = files.find((file) => (file.logicalPath || file.path) === logicalPath);
  return `/builder-data/${entry?.path || logicalPath}`;
}

async function loadBuilderDataManifest() {
  if (!manifestPromise) {
    manifestPromise = fetchJson("/builder-data/manifest.json").catch(() => null);
  }
  return manifestPromise;
}

async function loadTable(name, manifest = null) {
  const payload = await fetchJson(builderDataPath(manifest, `tables/${name}.json`));
  return payload.rows || [];
}

async function loadCatalogTables(tableDefinitions, manifest = null) {
  const rows = await Promise.all(tableDefinitions.map(([, tableName]) => loadTable(tableName, manifest)));
  return Object.fromEntries(tableDefinitions.map(([key], index) => [key, rows[index]]));
}

export {
  builderDataPath,
  fetchJson,
  loadBuilderDataManifest,
  loadCatalogTables,
};
