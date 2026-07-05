import { fetchJson, loadCatalogTables } from "./builder_catalog_loader.js";

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
  const [
    { buildCatalogIndexes },
    { CATALOG_TABLES },
    resolvedBootstrap,
    precomputedLoadouts,
    unitImages,
  ] = await Promise.all([
    import("./builder_catalog_indexes.js"),
    import("./builder_catalog_tables.js"),
    bootstrap ? Promise.resolve(bootstrap) : fetchJson("/builder-data/bootstrap.json"),
    fetchJson("/builder-data/precomputed-loadouts.json"),
    fetchJson("/builder-data/unit-images.json"),
  ]);
  const tables = await loadCatalogTables(CATALOG_TABLES);
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
