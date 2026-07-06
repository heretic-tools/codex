import {
  builderDataPath,
  fetchJson,
  loadBuilderDataManifest,
  loadCatalogTables,
} from "./builder_catalog_loader.js";

function catalogFromBootstrap(bootstrap) {
  return {
    bootstrap,
    factions: bootstrap.factions || [],
    battleSizes: bootstrap.battleSizes || [],
  };
}

async function loadBootstrap() {
  return catalogFromBootstrap(await fetchJson("/builder-data/bootstrap.json"));
}

async function loadCatalog(bootstrap = null) {
  const manifest = await loadBuilderDataManifest();
  const [
    { buildCatalogIndexes },
    { CATALOG_TABLES },
    resolvedBootstrap,
    precomputedLoadouts,
    unitImages,
  ] = await Promise.all([
    import("./builder_catalog_indexes.js"),
    import("./builder_catalog_tables.js"),
    bootstrap ? Promise.resolve(bootstrap) : fetchJson(builderDataPath(manifest, "bootstrap.json")),
    fetchJson(builderDataPath(manifest, "precomputed-loadouts.json")),
    fetchJson(builderDataPath(manifest, "unit-images.json")),
  ]);
  const tables = await loadCatalogTables(CATALOG_TABLES, manifest);
  return {
    ...catalogFromBootstrap(resolvedBootstrap),
    ...tables,
    ...buildCatalogIndexes(resolvedBootstrap, {
      ...tables,
      precomputedLoadouts,
      unitImages,
    }),
  };
}

export { loadBootstrap, loadCatalog };
