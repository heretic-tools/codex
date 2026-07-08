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

test("modern Codex hero headers match the Builder title layout", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));
  const mobileLayer = modernLayer.slice(modernLayer.indexOf("@media (max-width: 760px)"));

  assert.ok(modernLayer.includes(".codex-page .app-header.faction-hero-title"));
  assert.ok(modernLayer.includes("grid-template-columns: minmax(0, 1fr);"));
  assert.ok(modernLayer.includes("grid-template-rows: auto minmax(0, 1fr) auto;"));
  assert.ok(modernLayer.includes("var(--app-hero-image-overlay)"));
  assert.ok(modernLayer.includes("background-position: top center;"));
  assert.ok(modernLayer.includes(".codex-page .app-header.faction-hero-title .title"));
  assert.ok(modernLayer.includes("grid-row: 3;"));
  assert.ok(modernLayer.includes(".codex-page .app-header.faction-hero-title .app-title-text"));
  assert.ok(modernLayer.includes("white-space: normal;"));
  assert.ok(modernLayer.includes(".codex-page .app-header.faction-hero-title .app-header-actions"));
  assert.ok(modernLayer.includes("grid-row: 1;"));
  assert.ok(mobileLayer.includes(".codex-page .app-header.faction-hero-title"));
  assert.ok(mobileLayer.includes("min-height: 120px;"));
  assert.ok(mobileLayer.includes("padding: 14px 12px 10px;"));
});

test("Core Rules content pages inherit the Core Rules hero image", () => {
  const source = projectFile("HereticBuilder", "tools", "roster_builder_codex_core_rules.py");
  const heroReferences = source.match(/hero_image=CORE_RULES_IMAGE/g) || [];

  assert.ok(source.includes("CORE_RULES_IMAGE"));
  assert.ok(heroReferences.length >= 6);
});

test("modern Codex faction and unit image buttons use theme-aware overlays", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes(".codex-page .launcher.has-faction-image,"));
  assert.ok(modernLayer.includes(".codex-page .datasheet-tile.has-unit-image"));
  assert.ok(modernLayer.includes("aspect-ratio: auto;"));
  assert.ok(modernLayer.includes("color: var(--app-image-ink);"));
  assert.ok(modernLayer.includes("background: var(--app-image-overlay-split);"));
  assert.ok(modernLayer.includes("background: var(--app-image-overlay-bottom);"));
  assert.ok(modernLayer.includes("background-image: var(--background-art);"));
  assert.ok(modernLayer.includes("background-position: top center;"));
  assert.ok(modernLayer.includes(".codex-page .launcher.has-faction-image .label"));
  assert.ok(modernLayer.includes(".codex-page .launcher.has-faction-image .section-tag"));
  assert.ok(modernLayer.includes("bottom: 6px;"));
  assert.ok(modernLayer.includes("top: 10px;"));
  assert.ok(modernLayer.includes("background: var(--app-image-chip-bg);"));
  assert.ok(modernLayer.includes("color: var(--app-image-muted);"));
  assert.ok(modernLayer.includes(".codex-page .datasheet-tile.has-unit-image {\n    min-height: 56px;"));
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

test("modern Codex datasheet badges and mobile sections use theme tokens", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));
  const mobileLayer = modernLayer.slice(modernLayer.indexOf("@media (max-width: 760px)"));

  assert.ok(modernLayer.includes(".unit-keyword-tag,"));
  assert.ok(modernLayer.includes(".weapon-ability-tag"));
  assert.ok(modernLayer.includes(".unit-faction-ability-tag"));
  assert.ok(modernLayer.includes("background: var(--app-surface-2);"));
  assert.ok(modernLayer.includes("border-color: var(--app-accent-border);"));
  assert.ok(modernLayer.includes(".unit-restriction"));
  assert.ok(modernLayer.includes("border-left-color: var(--app-accent);"));
  assert.ok(modernLayer.includes("outline: 3px solid var(--app-focus-ring);"));
  assert.ok(modernLayer.includes("var(--app-image-overlay-split)"));
  assert.ok(modernLayer.includes("var(--app-image-overlay-bottom)"));
  assert.ok(mobileLayer.includes(".unit-detail-content,"));
  assert.ok(mobileLayer.includes(".unit-rules-grid {"));
  assert.ok(mobileLayer.includes("grid-template-columns: 1fr;"));
  assert.ok(mobileLayer.includes("gap: 10px;"));
  assert.ok(mobileLayer.includes(".unit-detail-page .panel-content"));
  assert.ok(mobileLayer.includes("padding: 10px max(10px, env(safe-area-inset-right)) 14px max(10px, env(safe-area-inset-left));"));
  assert.ok(source.includes("padding: 0 var(--mobile-content-pad, 10px) 10px;"));
  assert.doesNotMatch(modernLayer, /rgba\(40,\s*95,\s*159,\s*\.28\)/);
  assert.doesNotMatch(modernLayer, /#245c4f|#285f9f/i);
});

test("modern Codex lore and quote cards stay readable on the dark surface", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes(".rule-card.is-lore,"));
  assert.ok(modernLayer.includes(".rule-card.is-quote,"));
  assert.ok(modernLayer.includes(".lore-flavor-card,"));
  assert.ok(modernLayer.includes("color: var(--app-muted);"));
  assert.ok(modernLayer.includes("background: var(--app-accent-subtle);"));
  assert.ok(modernLayer.includes("border-left: 3px solid var(--app-accent);"));
  assert.ok(modernLayer.includes(".unit-ability-lore.lore-flavor-card"));
  assert.ok(modernLayer.includes(".rule-card.lore-flavor-card h3"));
  assert.ok(modernLayer.includes("color: var(--app-accent);"));
  assert.doesNotMatch(modernLayer, /#2c2518|#efe2c2|#8f7e5b/i);
});

test("modern Codex rule reference links use the shared accent badge style", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes(".codex-page .rule-ref-link"));
  assert.ok(modernLayer.includes("display: inline-flex;"));
  assert.ok(modernLayer.includes("color: var(--app-accent);"));
  assert.ok(modernLayer.includes("background: var(--app-accent-soft);"));
  assert.ok(modernLayer.includes("border: 0;"));
  assert.ok(modernLayer.includes("border-radius: 0;"));
  assert.ok(modernLayer.includes("font-family: var(--app-font-mono);"));
  assert.ok(modernLayer.includes(".codex-page .rule-ref-link:hover,"));
  assert.ok(modernLayer.includes(".codex-page .rule-ref-link:focus-visible"));
  assert.ok(modernLayer.includes("box-shadow: 0 0 0 3px var(--app-focus-ring);"));
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

test("modern Codex weapon tables become mobile stat cards", () => {
  const source = codexCss();
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes("@media (max-width: 760px)"));
  assert.ok(modernLayer.includes(".unit-weapons-card .unit-weapon-group"));
  assert.ok(modernLayer.includes("overflow: visible;"));
  assert.ok(modernLayer.includes(".unit-weapon-table,\n  .unit-weapon-table thead,\n  .unit-weapon-table tbody"));
  assert.ok(modernLayer.includes(".unit-weapon-table thead th:first-child"));
  assert.ok(modernLayer.includes(".unit-weapons-card .unit-weapon-group + .unit-weapon-group"));
  assert.ok(modernLayer.includes("margin-top: 10px;"));
  assert.ok(modernLayer.includes("background: var(--app-accent-soft);"));
  assert.ok(modernLayer.includes("text-transform: none;"));
  assert.ok(modernLayer.includes("display: block;"));
  assert.ok(modernLayer.includes(".unit-weapon-table tbody tr"));
  assert.ok(modernLayer.includes("grid-template-columns: repeat(6, minmax(0, 1fr));"));
  assert.ok(modernLayer.includes("justify-self: stretch;"));
  assert.ok(modernLayer.includes(".unit-weapon-table tbody td:nth-child(n)"));
  assert.ok(modernLayer.includes("width: 100%;"));
  assert.ok(modernLayer.includes(".unit-weapon-table tbody td::before"));
  assert.ok(modernLayer.includes("content: attr(data-label);"));
  assert.ok(modernLayer.includes("overflow-wrap: anywhere;"));
  assert.ok(modernLayer.includes(".unit-weapon-table .full-label"));
  assert.ok(modernLayer.includes(".unit-weapon-table .compact-label"));
  assert.ok(modernLayer.includes(".unit-weapon-table .full-label {\n    display: none;"));
  assert.ok(modernLayer.includes(".unit-weapon-table .compact-label {\n    display: inline;"));
  assert.doesNotMatch(modernLayer, /min-width:\s*560px/);
  assert.doesNotMatch(modernLayer, /position:\s*sticky/);
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
  assert.ok(generator.includes('<span class="compact-label">M</span>'));
  assert.doesNotMatch(generator, /<span class="compact-label">М<\/span>/);
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
  assert.ok(modernLayer.includes("grid-template-columns: repeat(auto-fit, minmax(68px, 1fr));"));
  assert.ok(modernLayer.includes("justify-self: stretch;"));
  assert.ok(modernLayer.includes("justify-items: center;"));
  assert.ok(modernLayer.includes("width: auto;"));
  assert.ok(modernLayer.includes("min-height: 56px;"));
  assert.ok(modernLayer.includes("border-radius: 0;"));
  assert.ok(modernLayer.includes(".unit-statline-card .unit-stat-table-no-model tbody td::before"));
  assert.ok(modernLayer.includes("content: attr(data-label);"));
  assert.ok(modernLayer.includes("font-family: var(--app-mono);"));
});
