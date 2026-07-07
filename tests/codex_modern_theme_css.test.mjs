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

test("Codex CSS no longer keeps legacy bevel borders", () => {
  const source = codexCss();

  assert.doesNotMatch(source, /border-width:\s*2px/);
  assert.doesNotMatch(source, /box-shadow:\s*inset/);
  assert.doesNotMatch(source, /var\(--light\).*var\(--shadow\)|var\(--shadow\).*var\(--light\)/);
});

test("modern Codex layer keeps one mobile max-width block", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));
  const matches = modernLayer.match(/@media \(max-width: 760px\)/g) || [];

  assert.equal(matches.length, 1);
});

test("modern Codex weapon tables use a mobile frozen weapon column", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes("@media (max-width: 760px)"));
  assert.ok(modernLayer.includes(".unit-weapons-card .unit-weapon-group"));
  assert.ok(modernLayer.includes("overflow-x: auto;"));
  assert.ok(modernLayer.includes(".unit-weapon-table thead th:first-child"));
  assert.ok(modernLayer.includes("position: sticky;"));
  assert.ok(modernLayer.includes("left: 0;"));
  assert.ok(modernLayer.includes("min-width: 640px;"));
});
