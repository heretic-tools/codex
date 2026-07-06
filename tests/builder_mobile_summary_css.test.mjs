import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function builderCss() {
  return readFileSync(join(projectRoot, "HereticBuilder", "static", "builder.css"), "utf8");
}

test("mobile roster summary is a bottom safe-area bar", () => {
  const source = builderCss();
  const mobileLayer = source.slice(source.indexOf("@media (max-width: 760px)"));

  assert.ok(mobileLayer.includes(".builder-panel-content:has(.roster-sticky-summary)"));
  assert.ok(mobileLayer.includes("padding-bottom: calc(166px + env(safe-area-inset-bottom));"));
  assert.ok(mobileLayer.includes(".roster-detail-grid .roster-sticky-summary"));
  assert.ok(mobileLayer.includes("position: fixed;"));
  assert.ok(mobileLayer.includes("bottom: calc(70px + env(safe-area-inset-bottom));"));
  assert.ok(mobileLayer.includes("left: max(8px, env(safe-area-inset-left));"));
  assert.ok(mobileLayer.includes(".builder-toast"));
  assert.ok(mobileLayer.includes("bottom: calc(158px + env(safe-area-inset-bottom));"));
});
