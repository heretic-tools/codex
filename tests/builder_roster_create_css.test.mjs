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
  assert.ok(source.includes("border-radius: var(--builder-radius);"));
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

test("Builder CSS does not keep legacy 2px bevel borders", () => {
  const source = builderCss();

  assert.doesNotMatch(source, /border-width:\s*2px/);
  assert.doesNotMatch(source, /border:\s*2px solid var\(--builder-light\)/);
  assert.doesNotMatch(source, /border-(?:top|right|bottom):\s*2px solid var\(--builder-(?:light|shadow)\)/);
  assert.doesNotMatch(source, /border-color:\s*var\(--builder-shadow\)\s+var\(--builder-light\)/);
});
