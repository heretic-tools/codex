import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function staticSource(filename) {
  return readFileSync(join(projectRoot, "HereticBuilder", "static", filename), "utf8");
}

test("Codex unit info cards collapse on mobile as progressive enhancement", () => {
  const source = staticSource("codex.js");

  assert.ok(source.includes("setupMobileUnitInfoCards"));
  assert.ok(source.includes(".unit-detail-page .unit-rules-grid > .unit-info-card"));
  assert.ok(source.includes('window.matchMedia("(max-width: 760px)")'));
  assert.ok(source.includes("unit-info-card-collapsible-body"));
  assert.ok(source.includes("unit-info-card-collapse-button"));
  assert.ok(source.includes('button.setAttribute("aria-expanded"'));
  assert.ok(source.includes('body.hidden = collapsed'));
  assert.ok(source.includes("media.addListener?.(applyMode)"));
});

test("Codex unit info card collapse controls use modern flat styles", () => {
  const source = staticSource("codex.css");
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes(".unit-info-card-toggle-row"));
  assert.ok(modernLayer.includes(".unit-info-card-collapse-button"));
  assert.ok(modernLayer.includes("background: var(--app-surface-2);"));
  assert.ok(modernLayer.includes(".unit-info-card-collapsible-body[hidden]"));
});
