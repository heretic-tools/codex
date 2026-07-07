import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function staticSource(filename) {
  return readFileSync(join(projectRoot, "HereticBuilder", "static", filename), "utf8");
}

test("Codex info and detachment rule cards collapse on mobile as progressive enhancement", () => {
  const source = staticSource("codex.js");

  assert.ok(source.includes("setupMobileCodexCollapsibleCards"));
  assert.ok(source.includes(".unit-detail-page .unit-rules-grid > .unit-info-card"));
  assert.ok(source.includes(".detachment-detail-page article.codex-content > .rule-card"));
  assert.ok(source.includes(".detachment-detail-page .detachment-card-grid > .detachment-feature-card"));
  assert.ok(source.includes(".detachment-detail-page .faq-section > .rule-card"));
  assert.ok(source.includes('window.matchMedia("(max-width: 760px)")'));
  assert.ok(source.includes("unit-info-card-collapsible-body"));
  assert.ok(source.includes("codex-collapsible-card-body"));
  assert.ok(source.includes("unit-info-card-collapse-button"));
  assert.ok(source.includes("codex-collapsible-card-button"));
  assert.ok(source.includes("card.dataset.collapsibleTitle = cardTitle(card)"));
  assert.ok(source.includes("card.dataset.collapsibleTitle || card.querySelector"));
  assert.ok(source.includes("headingRow = document.createElement(\"div\")"));
  assert.ok(source.includes("card.insertBefore(headingRow, heading)"));
  assert.ok(source.includes("headingRow.appendChild(button)"));
  assert.ok(source.includes('button.setAttribute("aria-expanded"'));
  assert.ok(source.includes("button.title = label"));
  assert.ok(source.includes('body.hidden = collapsed'));
  assert.ok(source.includes("media.addListener?.(applyMode)"));
});

test("Codex collapsible card controls use modern flat styles", () => {
  const source = staticSource("codex.css");
  const modernLayer = source.slice(source.indexOf("/* Modern Codex layer."));

  assert.ok(modernLayer.includes(".unit-info-card-toggle-row"));
  assert.ok(source.includes(".unit-info-card-toggle-row > h3"));
  assert.ok(modernLayer.includes(".rule-card-heading.codex-collapsible-card-toggle-row"));
  assert.ok(modernLayer.includes(".unit-info-card-collapse-button"));
  assert.ok(modernLayer.includes(".codex-collapsible-card-button"));
  assert.ok(modernLayer.includes("background: var(--app-surface-2);"));
  assert.ok(modernLayer.includes("@media (max-width: 760px)"));
  assert.ok(modernLayer.includes("min-height: 44px;"));
  assert.ok(modernLayer.includes(".unit-info-card-collapsible-body[hidden]"));
  assert.ok(modernLayer.includes(".codex-collapsible-card-body"));
});
