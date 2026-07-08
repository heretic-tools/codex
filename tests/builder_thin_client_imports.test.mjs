import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { basename, dirname, join, normalize } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const staticRoot = join(projectRoot, "HereticBuilder", "static");

function localStaticImports(filePath) {
  const source = readFileSync(filePath, "utf8");
  const imports = [];
  for (const match of source.matchAll(/^\s*import\s+(?:[^'"]+\s+from\s+)?["'](\.\/[^"']+\.js)["'];?/gm)) {
    imports.push(match[1]);
  }
  for (const match of source.matchAll(/^\s*export\s+[^'"]+\s+from\s+["'](\.\/[^"']+\.js)["'];?/gm)) {
    imports.push(match[1]);
  }
  return imports;
}

function reachableStaticModules(entryName) {
  const seen = new Set();
  const stack = [join(staticRoot, entryName)];
  while (stack.length) {
    const filePath = normalize(stack.pop());
    if (seen.has(filePath)) {
      continue;
    }
    seen.add(filePath);
    for (const relativeImport of localStaticImports(filePath)) {
      stack.push(join(dirname(filePath), relativeImport));
    }
  }
  return [...seen].map((filePath) => basename(filePath)).sort();
}

test("builder entry keeps route views, full catalog, and validators off the static startup graph", () => {
  const reachable = reachableStaticModules("builder.js");
  const disallowed = [
    "builder_catalog_indexes.js",
    "builder_catalog_tables.js",
    "builder_precomputed_loadouts_runtime.js",
    "builder_roster_create_view.js",
    "builder_roster_detail_view.js",
    "builder_roster_list_view.js",
    "builder_roster_transfer.js",
    "builder_roster_unit_detail_view.js",
    "builder_roster_validation.js",
    "builder_rules.js",
    "builder_validation_view.js",
  ];
  for (const fileName of disallowed) {
    assert.equal(reachable.includes(fileName), false, `${fileName} must be loaded dynamically`);
  }
});

test("builder roster list stays bootstrap-only and does not validate rows", () => {
  const entrySource = readFileSync(join(staticRoot, "builder.js"), "utf8");
  const listSource = readFileSync(join(staticRoot, "builder_roster_list_view.js"), "utf8");
  assert.doesNotMatch(entrySource, /state\.rosters\.length\s*\?\s*loadRules/);
  assert.doesNotMatch(entrySource, /refreshStaleRosterCaches/);
  assert.doesNotMatch(listSource, /validateRoster/);
});

test("builder roster list actions load the full catalog before validation", () => {
  const actionSource = readFileSync(join(staticRoot, "builder_roster_io_actions.js"), "utf8");

  assert.match(actionSource, /import \{ ensureCatalog \} from "\.\/builder_catalog_runtime\.js";/);
  assert.match(actionSource, /async function loadValidationRules\(\) \{\s*await ensureCatalog\(\);\s*return loadRules\(\);\s*\}/);
  assert.match(actionSource, /const \{ validateRoster \} = await loadValidationRules\(\);/);
});
