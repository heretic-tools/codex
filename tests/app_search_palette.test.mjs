import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function staticSource(filename) {
  return readFileSync(join(projectRoot, "HereticBuilder", "static", filename), "utf8");
}

test("app search exposes a keyboard palette shortcut and grouped results", () => {
  const source = staticSource("app-search.js");

  assert.ok(source.includes('input.setAttribute("aria-keyshortcuts", "Control+K Meta+K")'));
  assert.ok(source.includes("event.ctrlKey"));
  assert.ok(source.includes("event.metaKey"));
  assert.ok(source.includes("input.select()"));
  assert.ok(source.includes("function groupedResults"));
  assert.ok(source.includes("app-search-result-group"));
  assert.ok(source.includes("app-search-result-group-title"));
  assert.ok(source.includes('input.setAttribute("aria-controls", results.id)'));
  assert.ok(source.includes("function resultLinkLabel"));
  assert.ok(source.includes('link.setAttribute("aria-label", label)'));
  assert.ok(source.includes("function focusResult"));
  assert.ok(source.includes('event.key === "ArrowDown"'));
  assert.ok(source.includes("app-search-result-excerpt"));
});

test("app search grouped result styles stay inside the shared app shell", () => {
  const source = staticSource("app.css");

  assert.ok(source.includes(".app-search-result-group"));
  assert.ok(source.includes(".app-search-result-group-title"));
  assert.ok(source.includes(".app-search-result-excerpt"));
  assert.ok(source.includes("background: var(--app-surface-2);"));
  assert.ok(source.includes("border-bottom: 1px solid var(--app-border);"));
});

test("shared app shell keeps neutral panel tokens while Builder can use Codex desktop aliases", () => {
  const appSource = staticSource("app.css");
  const codexSource = staticSource("codex.css");
  const builderSource = staticSource("builder.css");

  assert.ok(appSource.includes("--app-panel: var(--app-surface);"));
  assert.ok(appSource.includes("--app-radius: 0;"));
  assert.doesNotMatch(`${appSource}\n${codexSource}`, /--window|var\(--window\)/);
  assert.match(builderSource, /var\(--window/);
  assert.doesNotMatch(codexSource, /Win95|faux desktop|titlebar/);
  assert.doesNotMatch(`${codexSource}\n${builderSource}`, /bevel-control|desktop-label|mobile-label/);
});

test("dark-first app palette uses a monochrome shell with semantic accents", () => {
  const appSource = staticSource("app.css");
  const manifestSource = staticSource("manifest.webmanifest");
  const rootBlock = appSource.match(/:root \{[\s\S]*?\n\}/)?.[0] || "";
  const lightBlock = appSource.match(/:root\[data-theme="light"\] \{[\s\S]*?\n\}/)?.[0] || "";

  assert.ok(rootBlock.includes("--color-bg-base: #1a1a1a;"));
  assert.ok(rootBlock.includes("--color-bg-surface: #202020;"));
  assert.ok(rootBlock.includes("--color-accent: #f2f2f2;"));
  assert.ok(rootBlock.includes("--app-focus-ring: rgba(255, 255, 255, .24);"));
  assert.ok(rootBlock.includes("--app-accent-soft: rgba(255, 255, 255, .12);"));
  assert.ok(rootBlock.includes("--app-faction-overlay: rgba(8, 8, 8, .48);"));
  assert.ok(rootBlock.includes("--app-image-ink: #ffffff;"));
  assert.ok(rootBlock.includes("--app-image-overlay-bottom:"));
  assert.ok(rootBlock.includes("--app-image-overlay-top:"));
  assert.ok(rootBlock.includes("--app-image-overlay-center:"));
  assert.ok(rootBlock.includes("--app-image-overlay-split:"));
  assert.ok(rootBlock.includes("--app-image-overlay: var(--app-image-overlay-bottom);"));
  assert.ok(rootBlock.includes("--app-hero-image-overlay: var(--app-image-overlay-split);"));
  assert.ok(rootBlock.includes("--app-disposition-take-and-hold: #2fbf71;"));
  assert.ok(rootBlock.includes("--app-disposition-disruption: #4f8cff;"));
  assert.ok(rootBlock.includes("--app-disposition-priority-assets: #e3a72f;"));
  assert.ok(rootBlock.includes("--app-disposition-purge-the-foe: #e25555;"));
  assert.ok(rootBlock.includes("--app-disposition-reconnaissance: #20b9a6;"));
  assert.ok(lightBlock.includes("--color-bg-base: #eeeeee;"));
  assert.ok(lightBlock.includes("--color-bg-surface: #f7f7f7;"));
  assert.doesNotMatch(lightBlock, /--app-image-(?:ink|overlay|muted|chip|control|text-shadow)|--app-hero-image-overlay/);
  assert.doesNotMatch(rootBlock, /--color-bg-base:\s*#000000/i);
  assert.doesNotMatch(rootBlock, /--color-accent:\s*#ff7a00/i);
  assert.ok(manifestSource.includes('"background_color": "#1a1a1a"'));
  assert.ok(manifestSource.includes('"theme_color": "#202020"'));
  assert.doesNotMatch(manifestSource, /#000000|#ff7a00/i);
  assert.doesNotMatch(`${staticSource("codex.css")}\n${staticSource("builder.css")}`, /rgba\(40,\s*95,\s*159,\s*\.28\)/);
  assert.doesNotMatch(`${staticSource("codex.css")}\n${staticSource("builder.css")}`, /background:\s*#000080/i);
});

test("shared app shell keeps all corners square", () => {
  const combined = `${staticSource("app.css")}\n${staticSource("codex.css")}\n${staticSource("builder.css")}`;
  const nonZeroRadii = [...combined.matchAll(/border(?:-(?:top|right|bottom|left))?(?:-(?:left|right))?-radius:\s*([^;]+);/g)]
    .map((match) => match[1].trim())
    .filter((value) => value !== "0");

  assert.deepEqual(nonZeroRadii, []);
});

test("shared mobile shell controls keep 44px touch targets", () => {
  const source = staticSource("app.css");
  const mobileLayer = source.slice(source.indexOf("@media (max-width: 460px)"));

  assert.ok(mobileLayer.includes(".favorite-toggle,"));
  assert.ok(mobileLayer.includes(".support-button,"));
  assert.ok(mobileLayer.includes(".theme-toggle,"));
  assert.ok(mobileLayer.includes(".app-search-input"));
  assert.ok(mobileLayer.includes("min-height: 44px;"));
  assert.ok(mobileLayer.includes(".app-search-clear"));
  assert.ok(mobileLayer.includes("width: 44px;"));
  assert.ok(mobileLayer.includes("height: 44px;"));
  assert.match(mobileLayer, /\.breadcrumb-menu-item\s*\{[\s\S]*min-height:\s*44px;/);
});

test("shared app header keeps long titles from clipping action controls", () => {
  const appSource = staticSource("app.css");
  const builderSource = staticSource("builder.css");

  assert.ok(appSource.includes(".shell {\n  width: min(1120px, 100%);\n  min-width: 0;"));
  assert.ok(appSource.includes(".app-header {\n  min-width: 0;"));
  assert.ok(appSource.includes(".app-header > .title"));
  assert.ok(appSource.includes("flex: 1 1 auto;"));
  assert.ok(appSource.includes(".app-header-actions"));
  assert.ok(appSource.includes("flex: 0 0 auto;"));
  assert.ok(builderSource.includes(".builder-app-header-actions"));
  assert.ok(builderSource.includes("flex: 0 0 auto;"));
});

test("theme toggle is a compact icon button with hidden text state", () => {
  const source = staticSource("app.css");

  assert.ok(source.includes(".theme-toggle::before"));
  assert.ok(source.includes('content: "";'));
  assert.ok(source.includes("width: 44px;"));
  assert.ok(source.includes("min-width: 44px;"));
  assert.ok(source.includes("min-height: 44px;"));
  assert.ok(source.includes(".theme-toggle[data-theme=\"light\"]::before"));
  assert.ok(source.includes(".theme-toggle [data-theme-toggle-label]"));
  assert.ok(source.includes("clip: rect(0, 0, 0, 0);"));
});
