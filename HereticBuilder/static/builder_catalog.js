import { buildCatalogIndexes } from "./builder_catalog_indexes.js";
import { fetchJson, loadCatalogTables } from "./builder_catalog_loader.js";
import { CATALOG_TABLES } from "./builder_catalog_tables.js";

async function loadCatalog() {
  const [bootstrap, tables] = await Promise.all([
    fetchJson("/builder-data/bootstrap.json"),
    loadCatalogTables(CATALOG_TABLES),
  ]);
  return {
    bootstrap,
    factions: bootstrap.factions || [],
    battleSizes: bootstrap.battleSizes || [],
    ...tables,
    ...buildCatalogIndexes(bootstrap, tables),
  };
}

export { loadCatalog };
