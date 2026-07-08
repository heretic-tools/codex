import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

test("static config cache-busts static CSS and JS assets only", () => {
  const html = execFileSync("python3", ["-c", `
import sys
sys.path.insert(0, "HereticBuilder/tools")
from build_static_site import inject_static_config

html = """<!doctype html>
<html>
<head>
  <link rel="stylesheet" href="/static/app.css">
  <link rel="stylesheet" href="/static/codex.css">
  <script src="/static/theme.js"></script>
  <script src="/static/pwa.js?v=already"></script>
</head>
<body>
  <img src="/assets/icons/codex.png">
</body>
</html>"""
print(inject_static_config(html, "/builder", asset_version="abc123def456"))
`], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  assert.match(html, /href="\/builder\/static\/app\.css\?v=abc123def456"/);
  assert.match(html, /href="\/builder\/static\/codex\.css\?v=abc123def456"/);
  assert.match(html, /src="\/builder\/static\/theme\.js\?v=abc123def456"/);
  assert.match(html, /src="\/builder\/static\/pwa\.js\?v=already"/);
  assert.match(html, /src="\/builder\/assets\/icons\/codex\.png"/);
});

test("GitHub Pages workflow can build standalone Builder separately", () => {
  const workflow = readFileSync(join(projectRoot, ".github", "workflows", "pages.yml"), "utf8");

  assert.match(workflow, /Build static Codex site/);
  assert.match(workflow, /github\.event\.repository\.name != 'builder'/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /PRODUCTION_CODEX_REF: 64100c7af26748a9bd494125eda20bfc41d58282/);
  assert.match(workflow, /Checkout production Codex source/);
  assert.ok(workflow.includes('git worktree add ../production-codex "$PRODUCTION_CODEX_REF"'));
  assert.ok(workflow.includes('python3 ../production-codex/HereticBuilder/tools/builder.py build --source ../production-codex --out "$GITHUB_WORKSPACE/dist"'));
  assert.match(workflow, /Reset production service worker/);
  assert.ok(workflow.includes('builder.py reset-service-worker --out dist --base-path "/${{ github.event.repository.name }}"'));
  assert.match(workflow, /Build beta index/);
  assert.ok(workflow.includes('builder.py build-beta-index --out dist/beta --base-path "/${{ github.event.repository.name }}/beta"'));
  assert.match(workflow, /Build beta Codex site/);
  assert.ok(workflow.includes('python3 ../production-codex/HereticBuilder/tools/builder.py build --source ../production-codex --out "$GITHUB_WORKSPACE/dist/beta/codex" --base-path "/${{ github.event.repository.name }}/beta/codex" --mount-codex-at-root'));
  assert.match(workflow, /Build beta Builder site/);
  assert.ok(workflow.includes('builder.py build-builder --out dist/beta/builder --base-path "/${{ github.event.repository.name }}/beta/builder"'));
  assert.match(workflow, /Build standalone Builder site/);
  assert.match(workflow, /github\.event\.repository\.name == 'builder'/);
  assert.ok(workflow.includes('builder.py build-builder --out dist --base-path "/${{ github.event.repository.name }}"'));
});

test("service worker reset patches production HTML without touching beta pages", () => {
  const outDir = mkdtempSync(join(tmpdir(), "heretic-sw-reset-"));
  try {
    writeFileSync(join(outDir, "index.html"), "<!doctype html><body>Prod</body>", "utf8");
    mkdirSync(join(outDir, "chaos"), { recursive: true });
    writeFileSync(join(outDir, "chaos", "index.html"), "<!doctype html><body>Chaos</body>", "utf8");
    mkdirSync(join(outDir, "beta", "codex"), { recursive: true });
    writeFileSync(join(outDir, "beta", "codex", "index.html"), "<!doctype html><body>Beta</body>", "utf8");

    execFileSync("python3", ["HereticBuilder/tools/builder.py", "reset-service-worker", "--out", outDir, "--base-path", "/codex"], {
      cwd: projectRoot,
      encoding: "utf8",
    });

    const worker = readFileSync(join(outDir, "service-worker.js"), "utf8");
    assert.match(worker, /registration\.unregister/);
    assert.match(worker, /client\.navigate/);

    const prod = readFileSync(join(outDir, "chaos", "index.html"), "utf8");
    assert.match(prod, /navigator\.serviceWorker\.controller/);
    assert.match(prod, /\/codex\/service-worker\.js/);

    const beta = readFileSync(join(outDir, "beta", "codex", "index.html"), "utf8");
    assert.doesNotMatch(beta, /serviceWorker/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("beta index links to beta Codex and Builder entry points", () => {
  const outDir = mkdtempSync(join(tmpdir(), "heretic-beta-index-"));
  try {
    const html = execFileSync("python3", ["HereticBuilder/tools/builder.py", "build-beta-index", "--out", outDir, "--base-path", "/codex/beta"], {
      cwd: projectRoot,
      encoding: "utf8",
    });

    assert.match(html, /Beta index:/);
    const index = readFileSync(join(outDir, "index.html"), "utf8");
    assert.match(index, /HereticTools Beta/);
    assert.match(index, /href="\/codex\/beta\/codex\/"/);
    assert.match(index, /href="\/codex\/beta\/builder\/"/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("Codex detail route helpers emit canonical directory hrefs", () => {
  const output = execFileSync("python3", ["-c", `
import sys
sys.path.insert(0, "HereticBuilder/tools")
from roster_builder_codex_common import datasheet_href, detachment_href

faction = {"name": "Heretic Astartes"}
print(datasheet_href(faction, {"name": "Abaddon the Despoiler"}))
print(detachment_href(faction, {"name": "Pactbound Zealots"}))
`], {
    cwd: projectRoot,
    encoding: "utf8",
  }).trim().split("\n");

  assert.deepEqual(output, [
    "/codex/faction/heretic-astartes/datasheet/abaddon-the-despoiler/",
    "/codex/faction/heretic-astartes/detachment/pactbound-zealots/",
  ]);
});
