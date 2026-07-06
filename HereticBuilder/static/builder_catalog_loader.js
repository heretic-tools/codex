import { siteHref } from "./builder_state.js";

let manifestPromise = null;

async function fetchJson(path) {
  const response = await fetch(siteHref(path), { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`${path}: ${response.status}`);
  }
  return response.json();
}

function builderDataEntry(manifest, logicalPath) {
  const files = manifest?.files || [];
  return files.find((file) => (file.logicalPath || file.path) === logicalPath);
}

function builderDataPath(manifest, logicalPath) {
  const entry = builderDataEntry(manifest, logicalPath);
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
  return tableRows(payload);
}

async function loadBuilderDataJson(logicalPath, manifest = null) {
  const resolvedManifest = manifest || await loadBuilderDataManifest();
  return fetchJson(builderDataPath(resolvedManifest, logicalPath));
}

function tableRows(payload) {
  const rows = payload?.rows || [];
  if (payload?.rowFormat !== "array") {
    return rows;
  }
  const columnNames = (payload.columns || []).map((column) => column.name);
  return rows.map((values) => Object.fromEntries(
    columnNames.map((name, index) => [name, values[index]])
  ));
}

async function loadCatalogTables(tableDefinitions, manifest = null) {
  const rows = await Promise.all(tableDefinitions.map(([, tableName]) => loadTable(tableName, manifest)));
  return Object.fromEntries(tableDefinitions.map(([key], index) => [key, rows[index]]));
}

function topLevelPrecomputedShardEntries(manifest, requested) {
  return (manifest?.files || []).filter((file) => {
    const logicalPath = file.logicalPath || file.path || "";
    if (!logicalPath.startsWith("precomputed-loadouts/") || logicalPath === "precomputed-loadouts/manifest.json") {
      return false;
    }
    const datasheetId = logicalPath.replace(/^precomputed-loadouts\//, "").replace(/\.json$/, "");
    return !requested.size || requested.has(datasheetId);
  });
}

async function loadPrecomputedLoadoutManifest(manifest = null) {
  try {
    return await loadBuilderDataJson("precomputed-loadouts/manifest.json", manifest);
  } catch {
    return null;
  }
}

async function loadPrecomputedLoadoutShards(datasheetIds, manifest = null) {
  const resolvedManifest = manifest || await loadBuilderDataManifest();
  const requested = new Set((datasheetIds || []).filter(Boolean));
  const precomputedManifest = await loadPrecomputedLoadoutManifest(resolvedManifest);
  const entries = (precomputedManifest?.shards || []).filter((entry) => (
    !requested.size || requested.has(entry.datasheetId)
  ));
  if (!entries.length && !precomputedManifest?.shards?.length) {
    return Promise.all(topLevelPrecomputedShardEntries(resolvedManifest, requested)
      .map((entry) => fetchJson(`/builder-data/${entry.path}`)));
  }
  return Promise.all(entries.map((entry) => fetchJson(`/builder-data/${entry.path}`)));
}

export {
  builderDataEntry,
  builderDataPath,
  fetchJson,
  loadBuilderDataManifest,
  loadBuilderDataJson,
  loadCatalogTables,
  loadPrecomputedLoadoutShards,
  tableRows,
};
