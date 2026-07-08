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
  assert.ok(modernLayer.includes("border: 0;"));
  assert.ok(modernLayer.includes("font-family: var(--app-mono"));
});

test("Codex datasheet list points render as shared meta badges", () => {
  const commonSource = readProjectFile("HereticBuilder", "tools", "roster_builder_codex_common.py");
  const factionSource = readProjectFile("HereticBuilder", "tools", "roster_builder_codex_factions.py");
  const detachmentSource = readProjectFile("HereticBuilder", "tools", "roster_builder_codex_detachments.py");
  const cssSource = readProjectFile("HereticBuilder", "static", "codex.css");

  assert.ok(commonSource.includes("def render_meta_badge(label):"));
  assert.ok(factionSource.includes("points_label ="));
  assert.ok(factionSource.includes("badge_html = render_meta_badge(points_label)"));
  assert.ok(factionSource.includes('render_list_item(datasheet["name"], "", href=href, badge_html=badge_html)'));
  assert.ok(factionSource.includes("f'{badge_html}'"));
  assert.ok(detachmentSource.includes("render_meta_badge,"));
  assert.ok(cssSource.includes(".datasheet-tile-text .meta-badge"));
});

test("Codex faction and unit art renders as themed background layers", () => {
  const commonSource = readProjectFile("HereticBuilder", "tools", "roster_builder_codex_common.py");
  const factionSource = readProjectFile("HereticBuilder", "tools", "roster_builder_codex_factions.py");
  const cssSource = readProjectFile("HereticBuilder", "static", "codex.css");

  assert.ok(commonSource.includes("style=\"--background-art: url("));
  assert.ok(factionSource.includes("style=\"--background-art: url("));
  assert.ok(cssSource.includes(".codex-root-page .launcher.has-faction-image::before"));
  assert.ok(cssSource.includes(".datasheet-tile.has-unit-image::before"));
  assert.ok(cssSource.includes("background-image: var(--background-art);"));
  assert.ok(cssSource.includes("color: var(--app-image-ink);"));
  assert.ok(cssSource.includes("background: var(--app-image-overlay-split);"));
  assert.ok(cssSource.includes("background: var(--app-image-overlay-bottom);"));
  assert.doesNotMatch(factionSource, /<img class="unit-art"/);
  assert.doesNotMatch(commonSource, /codex_launcher_image/);
});
