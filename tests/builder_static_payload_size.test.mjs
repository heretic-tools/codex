import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(projectRoot, "dist");
const builderTablesDir = join(distDir, "builder-data", "tables");
const searchIndexPath = join(distDir, "search-index.json");

const BUILDER_TABLES_BYTES_BUDGET = 20_500_000;
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

test("built Codex search index stays within the static payload budget", (t) => {
  if (!existsSync(searchIndexPath)) {
    t.skip("dist/search-index.json is not built");
    return;
  }

  const bytes = statSync(searchIndexPath).size;
  assert.ok(
    bytes <= SEARCH_INDEX_BYTES_BUDGET,
    `dist/search-index.json is ${bytes} bytes; budget is ${SEARCH_INDEX_BYTES_BUDGET} bytes`
  );
});
