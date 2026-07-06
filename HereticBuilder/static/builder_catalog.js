import {
  builderDataPath,
  fetchJson,
  loadBuilderDataManifest,
  loadCatalogTables,
  loadPrecomputedLoadoutShards,
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

function loadCatalogOptions(optionsOrBootstrap = null) {
  if (!optionsOrBootstrap || optionsOrBootstrap.exportSchemaVersion) {
    return { bootstrap: optionsOrBootstrap, preloadPrecomputedLoadouts: false };
  }
  return {
    bootstrap: optionsOrBootstrap.bootstrap || null,
    preloadPrecomputedLoadouts: Boolean(optionsOrBootstrap.preloadPrecomputedLoadouts),
  };
}

async function precomputedLoadoutsMap(manifest, preload) {
  if (!preload) {
    return new Map();
  }
  const { precomputedLoadoutsByContext } = await import("./builder_catalog_special_indexes.js");
  const shards = await loadPrecomputedLoadoutShards([], manifest);
  const map = new Map();
  for (const shard of shards) {
    for (const [key, record] of precomputedLoadoutsByContext(shard.contexts || [])) {
      map.set(key, record);
    }
  }
  return map;
}

async function loadCatalog(optionsOrBootstrap = null) {
  const options = loadCatalogOptions(optionsOrBootstrap);
  const manifest = await loadBuilderDataManifest();
  const [
    { buildCatalogIndexes },
    { CATALOG_TABLES },
    resolvedBootstrap,
    unitImages,
    precomputedLoadoutsByContextMap,
  ] = await Promise.all([
    import("./builder_catalog_indexes.js"),
    import("./builder_catalog_tables.js"),
    options.bootstrap ? Promise.resolve(options.bootstrap) : fetchJson(builderDataPath(manifest, "bootstrap.json")),
    fetchJson(builderDataPath(manifest, "unit-images.json")),
    precomputedLoadoutsMap(manifest, options.preloadPrecomputedLoadouts),
  ]);
  const tables = await loadCatalogTables(CATALOG_TABLES, manifest);
  return {
    ...catalogFromBootstrap(resolvedBootstrap),
    ...tables,
    ...buildCatalogIndexes(resolvedBootstrap, {
      ...tables,
      unitImages,
    }),
    precomputedLoadoutsByContext: precomputedLoadoutsByContextMap,
  };
}

export { loadBootstrap, loadCatalog };
