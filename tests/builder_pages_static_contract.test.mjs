import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

test("standalone Builder build emits GitHub Pages SPA fallback", () => {
  const outDir = mkdtempSync(join(tmpdir(), "heretic-builder-pages-fallback-"));
  try {
    execFileSync("python3", [
      "HereticBuilder/tools/build_builder_site.py",
      "--out",
      outDir,
      "--base-path",
      "/builder",
    ], { cwd: projectRoot });

    const index = readFileSync(join(outDir, "index.html"), "utf8");
    const notFound = readFileSync(join(outDir, "404.html"), "utf8");

    assert.equal(notFound, index);
    assert.ok(existsSync(join(outDir, ".nojekyll")));
    assert.match(index, /<meta name="heretic-base-path" content="\/builder">/);
    assert.match(index, /href="\/builder\/manifest\.webmanifest"/);
    assert.match(index, /src="\/builder\/static\/builder\.js\?v=[a-f0-9]{12}"/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
