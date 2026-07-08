import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function codexCss() {
  return readFileSync(join(projectRoot, "HereticBuilder", "static", "codex.css"), "utf8");
}

function projectFile(...parts) {
  return readFileSync(join(projectRoot, ...parts), "utf8");
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

test("modern Codex list items use app shell interaction tokens", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));
  const mobileLayer = modernLayer.slice(modernLayer.indexOf("@media (max-width: 760px)"));

  assert.ok(modernLayer.includes(".codex-page .list-item"));
  assert.ok(modernLayer.includes(".codex-page a.list-item:hover"));
  assert.ok(modernLayer.includes(".codex-page a.list-item:focus-visible"));
  assert.ok(modernLayer.includes("color: var(--app-ink);"));
  assert.ok(modernLayer.includes("background: var(--app-surface);"));
  assert.ok(modernLayer.includes("border: 1px solid var(--app-border);"));
  assert.ok(modernLayer.includes(".codex-page .list-item-meta"));
  assert.ok(modernLayer.includes("color: var(--app-muted);"));
  assert.ok(mobileLayer.includes(".codex-page .list-grid .list-item"));
  assert.ok(mobileLayer.includes("min-height: 56px;"));
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

test("Codex weapon table responsive labels avoid desktop-first class names", () => {
  const source = codexCss();
  const template = projectFile("HereticBuilder", "templates", "codex_unit_weapon_group.html");
  const generator = projectFile("HereticBuilder", "tools", "roster_builder_codex_datasheet.py");
  const combined = `${source}\n${template}\n${generator}`;

  assert.doesNotMatch(combined, /desktop-label|mobile-label/);
  assert.ok(source.includes(".full-label"));
  assert.ok(source.includes(".compact-label"));
  assert.ok(template.includes('class="full-label"'));
  assert.ok(template.includes('class="compact-label"'));
  assert.ok(generator.includes('class="full-label"'));
  assert.ok(generator.includes('class="compact-label"'));
});

test("modern Codex points tables become readable mobile lists", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes(".unit-points-card .unit-table-wrap"));
  assert.ok(modernLayer.includes("overflow: visible;"));
  assert.ok(modernLayer.includes(".unit-points-table thead"));
  assert.ok(modernLayer.includes("display: none;"));
  assert.ok(modernLayer.includes(".unit-points-table .unit-points-row"));
  assert.ok(modernLayer.includes("grid-template-columns: minmax(0, 1fr) auto;"));
  assert.ok(modernLayer.includes(".unit-points-table tbody th"));
  assert.ok(modernLayer.includes("background: transparent;"));
});

test("modern Codex statlines become labeled mobile stat grids", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes(".unit-statline-card .unit-stat-table-no-model"));
  assert.ok(modernLayer.includes("grid-template-columns: repeat(3, minmax(0, 1fr));"));
  assert.ok(modernLayer.includes("min-height: 48px;"));
  assert.ok(modernLayer.includes(".unit-statline-card .unit-stat-table-no-model tbody td::before"));
  assert.ok(modernLayer.includes("content: attr(data-label);"));
  assert.ok(modernLayer.includes("font-family: var(--app-mono);"));
});
