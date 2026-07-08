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

test("shared app shell uses neutral panel tokens instead of window aliases", () => {
  const appSource = staticSource("app.css");
  const codexSource = staticSource("codex.css");
  const builderSource = staticSource("builder.css");

  assert.ok(appSource.includes("--app-panel: var(--app-surface);"));
  assert.doesNotMatch(`${appSource}\n${codexSource}\n${builderSource}`, /--window|var\(--window\)/);
  assert.doesNotMatch(`${codexSource}\n${builderSource}`, /Win95|faux desktop|titlebar/);
  assert.doesNotMatch(`${codexSource}\n${builderSource}`, /bevel-control|desktop-label|mobile-label/);
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
