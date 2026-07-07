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
  assert.doesNotMatch(source, /\.battle-size-option \{[^}]+border-width: 2px;/);
});
