import { ALLIED_RESTRICTION_CATALOG_TABLES } from "./builder_catalog_allied_restriction_tables.js";
import { CORE_CATALOG_TABLES } from "./builder_catalog_core_tables.js";
import { ENHANCEMENT_CATALOG_TABLES } from "./builder_catalog_enhancement_tables.js";
import { WARGEAR_CATALOG_TABLES } from "./builder_catalog_wargear_tables.js";

const CATALOG_TABLES = [
  ...CORE_CATALOG_TABLES,
  ...ENHANCEMENT_CATALOG_TABLES,
  ...ALLIED_RESTRICTION_CATALOG_TABLES,
  ...WARGEAR_CATALOG_TABLES,
];

export { CATALOG_TABLES };
