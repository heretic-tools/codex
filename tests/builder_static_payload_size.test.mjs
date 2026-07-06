import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(projectRoot, "dist");
const builderTablesDir = join(distDir, "builder-data", "tables");
const searchIndexPath = join(distDir, "search-index.json");
const searchIndexManifestPath = join(distDir, "search-index", "manifest.json");

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
