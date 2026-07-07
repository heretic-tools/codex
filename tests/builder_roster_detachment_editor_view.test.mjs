import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  availableDetachments,
  costForDetachment,
  detachmentDispositionName,
  factionNamed,
  realCatalog,
  state,
} from "./builder_validation_helpers.mjs";
import {
  detachmentCandidateRows,
  detachmentCandidateStatus,
} from "../HereticBuilder/static/builder_roster_detachment_editor_view.js";
import {
  detachmentOpenLabel,
  renderDetachmentRow,
} from "../HereticBuilder/static/builder_roster_detachment_rows.js";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function createMockElement(tagName) {
  const node = {
    attributes: new Map(),
    children: [],
    className: "",
    dataset: {},
    href: "",
    tagName,
    textContent: "",
    title: "",
    type: "",
    append(...nodes) {
      for (const child of nodes) {
        this.appendChild(child);
      }
    },
    appendChild(child) {
      this.children.push(child);
      this.textContent += child?.textContent || "";
      return child;
    },
    addEventListener() {},
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
  };
  node.classList = {
    add(value) {
      node.className = `${node.className} ${value}`.trim();
    },
  };
  return node;
}

test("detachment candidate status explains detachment-point pressure", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const detachment = availableDetachments(faction.id)
    .find((row) => costForDetachment(row.id, faction.id) > 0);
  assert.ok(detachment, "Expected a detachment with a DP cost");
  const cost = costForDetachment(detachment.id, faction.id);
  const roster = {
    factionKeywordId: faction.id,
  };

  assert.deepEqual(
    detachmentCandidateStatus(roster, {
      points: {
        detachmentLimit: 0,
        detachmentPoints: 100,
      },
    }, detachment),
    { severity: "ok", reason: "" }
  );
  assert.deepEqual(
    detachmentCandidateStatus(roster, {
      points: {
        detachmentLimit: 100,
        detachmentPoints: 100,
      },
    }, detachment),
    { severity: "warning", reason: `${cost} DP over` }
  );
});

test("detachment candidate rows filter by name and disposition", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const roster = {
    detachmentIds: [],
    factionKeywordId: faction.id,
  };
  const validation = {
    points: {
      detachmentLimit: 10,
      detachmentPoints: 0,
    },
  };

  const pactbound = detachmentCandidateRows(roster, validation, "pactbound");
  assert.ok(pactbound.length);
  assert.ok(pactbound.every((row) => row.detachment.name.toLowerCase().includes("pactbound")));

  const firstDisposition = detachmentDispositionName(detachmentCandidateRows(roster, validation)[0].detachment);
  assert.ok(firstDisposition);
  const dispositionRows = detachmentCandidateRows(roster, validation, firstDisposition);
  assert.ok(dispositionRows.length);
  assert.ok(dispositionRows.every((row) => detachmentDispositionName(row.detachment) === firstDisposition));
  assert.deepEqual(detachmentCandidateRows(roster, validation, "definitely-no-detachment"), []);
});

test("detachment editor focuses search when jumped from mobile summary", () => {
  const source = readFileSync(
    join(projectRoot, "HereticBuilder", "static", "builder_roster_detachment_controls.js"),
    "utf8"
  );
  const searchFocusIndex = source.indexOf('search.dataset.focusTarget = "true"');
  const selectFocusIndex = source.indexOf('select.dataset.focusTarget = "true"');

  assert.ok(searchFocusIndex >= 0);
  assert.ok(selectFocusIndex >= 0);
  assert.ok(searchFocusIndex < selectFocusIndex);
  assert.ok(source.includes('add.dataset.editorPrimaryAction = "true"'));
});

test("detachment rows label their Codex links", () => {
  state.catalog = realCatalog;
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const faction = factionNamed("Heretic Astartes");
    const detachment = availableDetachments(faction.id)
      .find((row) => row.name === "Pactbound Zealots");
    const row = renderDetachmentRow(
      { factionKeywordId: faction.id },
      detachment.id,
      0,
      { messages: [] },
      () => {}
    );
    const link = row.children[0];
    const expectedLabel = `Open Codex detachment: ${detachment.name}, ${detachmentDispositionName(detachment)}, ${costForDetachment(detachment.id, faction.id)} DP`;

    assert.equal(detachmentOpenLabel({ factionKeywordId: faction.id }, detachment), expectedLabel);
    assert.equal(link.tagName, "a");
    assert.equal(link.href, "/faction/heretic-astartes/detachment/pactbound-zealots");
    assert.equal(link.title, expectedLabel);
    assert.equal(link.attributes.get("aria-label"), expectedLabel);
  } finally {
    global.document = previousDocument;
  }
});
