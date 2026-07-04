import { buildCatalogIndexes } from "./builder_catalog_indexes.js";
import { fetchJson, loadCatalogTables } from "./builder_catalog_loader.js";
import { CATALOG_TABLES } from "./builder_catalog_tables.js";

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
  const [resolvedBootstrap, tables] = await Promise.all([
    bootstrap ? Promise.resolve(bootstrap) : fetchJson("/builder-data/bootstrap.json"),
    loadCatalogTables(CATALOG_TABLES),
  ]);
  return {
    ...catalogFromBootstrap(resolvedBootstrap),
    ...tables,
    ...buildCatalogIndexes(resolvedBootstrap, tables),
  };
}

export { loadBootstrap, loadCatalog };
