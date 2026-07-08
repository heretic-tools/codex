import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function builderCss() {
  return readFileSync(join(projectRoot, "HereticBuilder", "static", "builder.css"), "utf8");
}

function modernLayer(source = builderCss()) {
  return source.slice(source.indexOf("/* Modern app layer."));
}

test("roster create form keeps confirm as the only full-width action", () => {
  const source = modernLayer();
  const actionsBlock = source.match(/\.roster-create-form \.form-actions \{[^}]+\}/)?.[0] || "";

  assert.ok(actionsBlock.includes("grid-template-columns: 1fr;"));
  assert.doesNotMatch(actionsBlock, /repeat\(2/);
});

test("roster create battle size picker uses flat theme tokens", () => {
  const fullSource = builderCss();
  const source = modernLayer();

  assert.ok(source.includes(".battle-size-options"));
  assert.ok(source.includes("gap: 8px;"));
  assert.ok(source.includes(".battle-size-option {"));
  assert.ok(source.includes("border: 1px solid var(--builder-border);"));
  assert.ok(source.includes("border-radius: 0;"));
  assert.ok(source.includes(".battle-size-option + .battle-size-option"));
  assert.ok(source.includes("margin-left: 0;"));
  assert.ok(source.includes(".battle-size-option.is-selected"));
  assert.ok(source.includes("border-color: var(--builder-blue);"));
  assert.ok(source.includes(".battle-size-option:has(input:focus-visible)"));
  assert.ok(fullSource.includes(".battle-size-option input"));
  assert.ok(fullSource.includes("inset: 0;"));
  assert.ok(fullSource.includes("inline-size: 100%;"));
  assert.ok(fullSource.includes("block-size: 100%;"));
  assert.ok(fullSource.includes("opacity: 0;"));
  assert.doesNotMatch(source, /\.battle-size-option \{[^}]+border-width: 2px;/);
});

test("roster overview actions fit the full delete roster label", () => {
  const source = builderCss();
  const actionsBlock = source.match(/\.roster-overview-action-row \{[^}]+\}/)?.[0] || "";

  assert.ok(actionsBlock.includes("grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));"));
});

test("Builder shared controls no longer keep a bevel fallback", () => {
  const source = builderCss();
  const sharedControlBlock = source.match(/\.builder-row,\n\.plain-button,\n\.primary-button,\n\.remove-button,\n\.validation-action-button \{[^}]+\}/)?.[0] || "";

  assert.ok(sharedControlBlock.includes("border: 1px solid var(--builder-border);"));
  assert.ok(sharedControlBlock.includes("box-shadow: none;"));
  assert.doesNotMatch(sharedControlBlock, /border-width:\s*2px/);
  assert.doesNotMatch(sharedControlBlock, /border-color:\s*var\(--builder-light\).*var\(--builder-shadow\)/s);
});

test("Builder unit and roster art renders as themed background layers", () => {
  const source = builderCss();
  const imageSource = readFileSync(join(projectRoot, "HereticBuilder", "static", "builder_unit_images.js"), "utf8");
  const rosterRouteSource = readFileSync(join(projectRoot, "HereticBuilder", "static", "builder_route_roster_detail_renderer.js"), "utf8");
  const unitRouteSource = readFileSync(join(projectRoot, "HereticBuilder", "static", "builder_route_unit_detail_renderer.js"), "utf8");
  const overviewSource = readFileSync(join(projectRoot, "HereticBuilder", "static", "builder_roster_overview_view.js"), "utf8");

  assert.ok(source.includes(".has-background-art::before"));
  assert.ok(source.includes("background-image: var(--background-art);"));
  assert.ok(source.includes("background-position: top center;"));
  assert.ok(source.includes(".has-background-art::after"));
  assert.ok(source.includes(".builder-app-header.has-background-art,"));
  assert.ok(source.includes(".builder-row.has-background-art,"));
  assert.ok(source.includes(".unit-overview-card.has-background-art,"));
  assert.ok(source.includes(".builder-row.has-background-art {\n  min-height: 70px;\n  align-items: stretch;\n  padding-top: 18px;\n  padding-bottom: 6px;"));
  assert.ok(source.includes(".builder-row.has-background-art .row-text {\n  align-self: end;"));
  assert.ok(source.includes(".builder-row.has-background-art .row-meta {\n  align-self: start;"));
  assert.ok(source.includes(".unit-list-item {"));
  assert.ok(source.includes(".unit-list-item.has-background-art::after {\n  background: var(--app-image-overlay-bottom);"));
  assert.ok(source.includes(".unit-list-item .unit-editor-row"));
  assert.ok(source.includes(".unit-list-item.has-background-art .unit-open-button"));
  assert.ok(source.includes("grid-template-rows: auto minmax(0, 1fr) auto;"));
  assert.ok(source.includes(".unit-row-top"));
  assert.ok(source.includes(".unit-list-item.has-background-art .unit-row-name"));
  assert.ok(source.includes(".unit-list-item.has-background-art .unit-actions-trigger"));
  assert.ok(source.includes(".unit-list-item:has(.unit-actions-menu[open]) {\n  z-index: 48;"));
  assert.ok(source.includes(".roster-list-item.has-background-art .roster-row {\n  min-height: 76px;\n  align-items: stretch;\n  padding-top: 18px;\n  padding-bottom: 6px;"));
  assert.ok(source.includes(".roster-list-item.has-background-art .roster-row .row-text {\n  align-self: end;"));
  assert.ok(source.includes("color: var(--app-image-ink);"));
  assert.ok(source.includes("background: var(--app-image-overlay-split);"));
  assert.doesNotMatch(source, /background:\s*var\(--app-image-overlay-center\);/);
  assert.ok(source.includes("background: var(--app-hero-image-overlay);"));
  assert.ok(source.includes("background: var(--app-image-chip-bg);"));
  assert.ok(source.includes(".builder-app-header.has-background-art .app-title-text"));
  assert.ok(source.includes(".builder-app-header.has-background-art .title"));
  assert.ok(source.includes("grid-template-columns: minmax(0, 1fr);"));
  assert.ok(source.includes("grid-template-rows: auto minmax(0, 1fr) auto;"));
  assert.ok(source.includes(".builder-app-header.has-background-art .title {\n  grid-column: 1;\n  grid-row: 3;"));
  assert.ok(source.includes(".builder-app-header.has-background-art .builder-app-header-actions {\n  grid-column: 1;\n  grid-row: 1;"));
  assert.ok(source.includes("align-self: start;"));
  assert.ok(source.includes("white-space: normal;"));
  assert.ok(source.includes(".roster-list-item.has-background-art .roster-actions-trigger"));
  assert.ok(source.includes(".roster-list-item:has(.roster-actions-menu[open]) {\n  z-index: 48;"));
  assert.ok(source.includes("background: transparent;"));
  assert.ok(source.includes("backdrop-filter: blur(8px);"));
  assert.ok(source.includes(".disposition-badge {\n  color: #fff;\n  background: #8b5cf6;"));
  assert.ok(rosterRouteSource.includes('applyFactionBackgroundArt(el.header, summary?.factionImageFilename || roster.factionKeywordId, "has-roster-hero")'));
  assert.ok(unitRouteSource.includes('applyUnitBackgroundArt(el.header, unit.datasheetId, "has-unit-image")'));
  assert.doesNotMatch(overviewSource, /applyFactionBackgroundArt/);
  assert.ok(imageSource.includes("applyUnitBackgroundArt"));
  assert.ok(imageSource.includes("applyFactionBackgroundArt"));
  assert.doesNotMatch(imageSource, /createElement\(["']img["']\)/);
  assert.doesNotMatch(source, /roster-unit-art-frame|attachment-unit-art-frame|unit-detail-art-frame/);
});

test("Builder CSS does not keep legacy 2px bevel borders", () => {
  const source = builderCss();

  assert.doesNotMatch(source, /border-width:\s*2px/);
  assert.doesNotMatch(source, /border:\s*2px solid var\(--builder-light\)/);
  assert.doesNotMatch(source, /border-(?:top|right|bottom):\s*2px solid var\(--builder-(?:light|shadow)\)/);
  assert.doesNotMatch(source, /border-color:\s*var\(--builder-shadow\)\s+var\(--builder-light\)/);
});
