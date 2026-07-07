import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function builderCss() {
  return readFileSync(join(projectRoot, "HereticBuilder", "static", "builder.css"), "utf8");
}

function builderSource(filename) {
  return readFileSync(join(projectRoot, "HereticBuilder", "static", filename), "utf8");
}

function modernMobileLayer(source = builderCss()) {
  return source.slice(source.lastIndexOf("@media (max-width: 760px)"));
}

test("Builder CSS keeps one consolidated mobile max-width layer", () => {
  const source = builderCss();
  const matches = source.match(/@media \(max-width: 760px\)/g) || [];

  assert.equal(matches.length, 1);
});

test("mobile roster summary is a bottom safe-area bar", () => {
  const source = builderCss();
  const mobileLayer = modernMobileLayer(source);

  assert.ok(mobileLayer.includes(".app-frame:has(.roster-sticky-summary) .app-footer"));
  assert.ok(mobileLayer.includes("display: none;"));
  assert.ok(mobileLayer.includes(".builder-panel-content:has(.roster-sticky-summary)"));
  assert.ok(mobileLayer.includes("padding-bottom: calc(196px + env(safe-area-inset-bottom));"));
  assert.ok(mobileLayer.includes(".builder-panel-content:has(.unit-detail-grid .roster-sticky-summary)"));
  assert.ok(mobileLayer.includes("padding-bottom: calc(82px + env(safe-area-inset-bottom));"));
  assert.ok(mobileLayer.includes(".builder-panel-content:has(.unit-detail-grid .roster-sticky-summary.has-actions)"));
  assert.ok(mobileLayer.includes("padding-bottom: calc(196px + env(safe-area-inset-bottom));"));
  assert.ok(mobileLayer.includes(".roster-detail-grid .roster-sticky-summary"));
  assert.ok(mobileLayer.includes("position: fixed;"));
  assert.ok(mobileLayer.includes("bottom: max(8px, env(safe-area-inset-bottom));"));
  assert.ok(mobileLayer.includes("left: max(8px, env(safe-area-inset-left));"));
  assert.ok(mobileLayer.includes("grid-template-columns: auto minmax(0, 1fr);"));
  assert.ok(mobileLayer.includes(".roster-sticky-summary .roster-sticky-summary-metrics"));
  assert.ok(mobileLayer.includes(".roster-sticky-summary-actions"));
  assert.ok(source.includes("grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));"));
  assert.ok(mobileLayer.includes(".builder-toast"));
  assert.ok(mobileLayer.includes("bottom: calc(132px + env(safe-area-inset-bottom));"));
  assert.ok(source.includes(".roster-sticky-summary-actions"));
  assert.ok(source.includes(".roster-sticky-summary-action"));
});

test("mobile roster summary actions expose add-section shortcuts", () => {
  const source = builderSource("builder_roster_detail_view.js");

  assert.ok(source.includes('label: "Issues"'));
  assert.ok(source.includes('ariaLabel: "Add detachment"'));
  assert.ok(source.includes('label: "+ Detach"'));
  assert.ok(source.includes('ariaLabel: "Add unit"'));
  assert.ok(source.includes('label: "+ Unit"'));
  assert.ok(source.includes('ariaLabel: "Add attached unit"'));
});

test("mobile Builder action controls keep 44px touch targets", () => {
  const mobileLayer = modernMobileLayer();

  assert.ok(mobileLayer.includes(".builder-search-field"));
  assert.ok(mobileLayer.includes("grid-template-columns: minmax(0, 1fr) 44px;"));
  assert.ok(mobileLayer.includes(".add-button,"));
  assert.ok(mobileLayer.includes(".remove-button,"));
  assert.ok(mobileLayer.includes(".attachment-member .remove-button,"));
  assert.ok(mobileLayer.includes(".search-clear-button,"));
  assert.ok(mobileLayer.includes(".roster-action-button,"));
  assert.ok(mobileLayer.includes(".roster-sticky-summary-action,"));
  assert.ok(mobileLayer.includes(".toast-action,"));
  assert.ok(mobileLayer.includes(".wargear-count-button"));
  assert.ok(mobileLayer.includes('.wargear-option-row input[type="checkbox"]'));
  assert.ok(mobileLayer.includes("min-width: 44px;"));
  assert.ok(mobileLayer.includes("min-height: 44px;"));
  assert.ok(mobileLayer.includes("width: 44px;"));
  assert.ok(mobileLayer.includes("height: 44px;"));
  assert.ok(mobileLayer.includes("grid-template-columns: 44px minmax(0, 1fr) 44px;"));
});

test("mobile unit and detachment add controls stay inline", () => {
  const mobileLayer = modernMobileLayer();

  assert.ok(mobileLayer.includes(".detachment-control-row,"));
  assert.ok(mobileLayer.includes(".unit-control-row {"));
  assert.ok(mobileLayer.includes("grid-template-columns: minmax(0, 1fr) auto;"));
  assert.ok(mobileLayer.includes(".detachment-control-row .builder-search-field,"));
  assert.ok(mobileLayer.includes(".unit-control-row .builder-search-field {"));
  assert.ok(mobileLayer.includes("grid-column: 1 / -1;"));
});
