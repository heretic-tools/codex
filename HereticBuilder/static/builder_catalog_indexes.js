import { buildCatalogGroupIndexes } from "./builder_catalog_group_indexes.js";
import { buildCatalogIdIndexes } from "./builder_catalog_id_indexes.js";

function buildCatalogIndexes(bootstrap, tables) {
  return {
    ...buildCatalogIdIndexes(bootstrap, tables),
    ...buildCatalogGroupIndexes(tables),
  };
}

export { buildCatalogIndexes };
