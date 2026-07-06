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
});

test("app search grouped result styles stay inside the shared app shell", () => {
  const source = staticSource("desktop.css");

  assert.ok(source.includes(".app-search-result-group"));
  assert.ok(source.includes(".app-search-result-group-title"));
  assert.ok(source.includes("background: var(--app-surface-2);"));
  assert.ok(source.includes("border-bottom: 1px solid var(--app-border);"));
});

test("shared mobile shell controls keep 44px touch targets", () => {
  const source = staticSource("desktop.css");
  const mobileLayer = source.slice(source.indexOf("@media (max-width: 460px)"));

  assert.ok(mobileLayer.includes(".favorite-toggle,"));
  assert.ok(mobileLayer.includes(".support-button,"));
  assert.ok(mobileLayer.includes(".theme-toggle,"));
  assert.ok(mobileLayer.includes(".app-search-input"));
  assert.ok(mobileLayer.includes("min-height: 44px;"));
  assert.ok(mobileLayer.includes(".app-search-clear"));
  assert.ok(mobileLayer.includes("width: 44px;"));
  assert.ok(mobileLayer.includes("height: 44px;"));
});
