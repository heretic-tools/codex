import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
  assert.match(workflow, /builder\.py build --out dist/);
  assert.match(workflow, /Build standalone Builder site/);
  assert.match(workflow, /github\.event\.repository\.name == 'builder'/);
  assert.ok(workflow.includes('builder.py build-builder --out dist --base-path "/${{ github.event.repository.name }}"'));
});
