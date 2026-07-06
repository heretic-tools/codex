import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(projectRoot, "dist");
const builderDataDir = join(distDir, "builder-data");
const builderTablesDir = join(distDir, "builder-data", "tables");
const searchIndexPath = join(distDir, "search-index.json");
const searchIndexManifestPath = join(distDir, "search-index", "manifest.json");

const BUILDER_BOOTSTRAP_BYTES_BUDGET = 12_000;
const BUILDER_DATA_MANIFEST_BYTES_BUDGET = 12_000;
const BUILDER_PRECOMPUTED_MANIFEST_BYTES_BUDGET = 190_000;
const BUILDER_TABLES_BYTES_BUDGET = 6_800_000;
const SEARCH_INDEX_BYTES_BUDGET = 7_100_000;

function jsonFileBytes(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .reduce((total, name) => total + statSync(join(dir, name)).size, 0);
}

test("built Builder table payload stays within the thin-client budget", (t) => {
  if (!existsSync(builderTablesDir)) {
    t.skip("dist/builder-data/tables is not built");
    return;
  }

  const bytes = jsonFileBytes(builderTablesDir);
  assert.ok(
    bytes <= BUILDER_TABLES_BYTES_BUDGET,
    `dist/builder-data/tables is ${bytes} bytes; budget is ${BUILDER_TABLES_BYTES_BUDGET} bytes`
  );
});

function hashedJsonBytes(dir, prefix) {
  if (!existsSync(dir)) {
    return 0;
  }
  const name = readdirSync(dir)
    .find((entry) => entry.startsWith(prefix) && entry.endsWith(".json"));
  return name ? statSync(join(dir, name)).size : 0;
}

test("built Builder startup manifests stay within the thin-client budget", (t) => {
  if (!existsSync(builderDataDir)) {
    t.skip("dist/builder-data is not built");
    return;
  }

  const bootstrapBytes = statSync(join(builderDataDir, "bootstrap.json")).size;
  const manifestBytes = statSync(join(builderDataDir, "manifest.json")).size;
  const precomputedManifestBytes = hashedJsonBytes(
    join(builderDataDir, "precomputed-loadouts"),
    "manifest-"
  );

  assert.ok(
    bootstrapBytes <= BUILDER_BOOTSTRAP_BYTES_BUDGET,
    `dist/builder-data/bootstrap.json is ${bootstrapBytes} bytes; budget is ${BUILDER_BOOTSTRAP_BYTES_BUDGET} bytes`
  );
  assert.ok(
    manifestBytes <= BUILDER_DATA_MANIFEST_BYTES_BUDGET,
    `dist/builder-data/manifest.json is ${manifestBytes} bytes; budget is ${BUILDER_DATA_MANIFEST_BYTES_BUDGET} bytes`
  );
  assert.ok(
    precomputedManifestBytes <= BUILDER_PRECOMPUTED_MANIFEST_BYTES_BUDGET,
    `dist/builder-data/precomputed-loadouts/manifest is ${precomputedManifestBytes} bytes; budget is ${BUILDER_PRECOMPUTED_MANIFEST_BYTES_BUDGET} bytes`
  );
});

function searchShardBytes(manifest) {
  return (manifest.shards || [])
    .reduce((total, shard) => total + statSync(join(distDir, shard.path.replace(/^\/+/, ""))).size, 0);
}

test("built Codex search index stays within the static payload budget", (t) => {
  if (existsSync(searchIndexManifestPath)) {
    const manifest = JSON.parse(readFileSync(searchIndexManifestPath, "utf8"));
    const bytes = statSync(searchIndexManifestPath).size + searchShardBytes(manifest);
    assert.ok(manifest.shards?.length > 1, "search-index manifest should point to sharded payloads");
    assert.ok(
      bytes <= SEARCH_INDEX_BYTES_BUDGET,
      `dist/search-index shards are ${bytes} bytes; budget is ${SEARCH_INDEX_BYTES_BUDGET} bytes`
    );
    return;
  }
  if (!existsSync(searchIndexPath)) {
    t.skip("dist/search-index is not built");
    return;
  }

  const bytes = statSync(searchIndexPath).size;
  assert.ok(
    bytes <= SEARCH_INDEX_BYTES_BUDGET,
    `dist/search-index.json is ${bytes} bytes; budget is ${SEARCH_INDEX_BYTES_BUDGET} bytes`
  );
});
