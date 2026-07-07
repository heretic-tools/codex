import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return jsFiles(path);
    }
    return entry.isFile() && path.endsWith(".js") ? [path] : [];
  });
}

test("Builder modules import textNode when they call it", () => {
  const offenders = jsFiles("HereticBuilder/static").filter((path) => {
    if (path.endsWith("builder_dom.js")) {
      return false;
    }
    const source = readFileSync(path, "utf8");
    if (!source.includes("textNode(")) {
      return false;
    }
    return !/import\s*\{[\s\S]*?\btextNode\b[\s\S]*?\}\s*from\s*["']\.\/builder_dom\.js["']/.test(source);
  });

  assert.deepEqual(offenders, []);
});
