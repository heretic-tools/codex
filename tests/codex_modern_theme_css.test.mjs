import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function codexCss() {
  return readFileSync(join(projectRoot, "HereticBuilder", "static", "codex.css"), "utf8");
}

test("modern Codex launcher interactions use theme tokens", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes(".codex-page .launcher:hover"));
  assert.ok(modernLayer.includes("background: var(--app-surface-2);"));
  assert.ok(modernLayer.includes("border-color: var(--app-accent);"));
  assert.doesNotMatch(modernLayer, /background:\s*#fbfaf7/i);
  assert.doesNotMatch(modernLayer, /border-color:\s*rgba\(36,\s*92,\s*79/i);
});

test("modern Codex table surfaces override legacy light backgrounds", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes(".unit-statline-card .unit-stat-table tbody th"));
  assert.ok(modernLayer.includes(".unit-points-table tbody th"));
  assert.ok(modernLayer.includes(".unit-weapon-table tbody tr:nth-child(even) th"));
  assert.ok(modernLayer.includes('.rule-table.has-header td[data-label=""]'));
  assert.ok(modernLayer.includes("background: var(--app-surface);"));
  assert.ok(modernLayer.includes("background: var(--app-surface-2);"));
});
