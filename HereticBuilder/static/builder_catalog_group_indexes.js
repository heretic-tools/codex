import { buildAlliedGroupIndexes } from "./builder_catalog_allied_group_indexes.js";
import { buildDetachmentGroupIndexes } from "./builder_catalog_detachment_group_indexes.js";
import { buildEnhancementGroupIndexes } from "./builder_catalog_enhancement_group_indexes.js";
import { buildUnitGroupIndexes } from "./builder_catalog_unit_group_indexes.js";
import { buildWargearGroupIndexes } from "./builder_catalog_wargear_group_indexes.js";

function buildCatalogGroupIndexes(tables) {
  return {
    ...buildDetachmentGroupIndexes(tables),
    ...buildUnitGroupIndexes(tables),
    ...buildEnhancementGroupIndexes(tables),
    ...buildAlliedGroupIndexes(tables),
    ...buildWargearGroupIndexes(tables),
  };
}

export { buildCatalogGroupIndexes };
