import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function readProjectFile(...parts) {
  return readFileSync(join(projectRoot, ...parts), "utf8");
}

test("Codex datasheet group headings render static count badges", () => {
  const source = readProjectFile("HereticBuilder", "tools", "roster_builder_codex_factions.py");

  assert.ok(source.includes("group_count = len(group_datasheets)"));
  assert.ok(source.includes('class="datasheet-group-label"'));
  assert.ok(source.includes('class="datasheet-group-count"'));
  assert.ok(source.includes("{group_count}"));
});

test("Codex datasheet group count badges use modern theme tokens", () => {
  const source = readProjectFile("HereticBuilder", "static", "codex.css");
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(source.includes(".datasheet-group-count"));
  assert.ok(modernLayer.includes(".datasheet-group-title"));
  assert.ok(modernLayer.includes(".datasheet-group-count"));
  assert.ok(modernLayer.includes("background: var(--app-surface-2);"));
  assert.ok(modernLayer.includes("border: 1px solid var(--app-border);"));
  assert.ok(modernLayer.includes("font-family: var(--app-mono"));
});
