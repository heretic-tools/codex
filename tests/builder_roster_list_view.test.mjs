import assert from "node:assert/strict";
import test from "node:test";

import { rosterLine, rosterPointsLabel } from "../HereticBuilder/static/builder_roster_list_rows.js";
import {
  rosterDetachmentBadgeClass,
  rosterValidationBadgeClass,
  rosterValidationBadgeLabel,
} from "../HereticBuilder/static/builder_roster_list_view.js";

function createMockElement(tagName) {
  return {
    attributes: new Map(),
    children: [],
    className: "",
    tagName,
    textContent: "",
    title: "",
    append(...nodes) {
      for (const node of nodes) {
        this.appendChild(node);
      }
    },
    appendChild(node) {
      this.children.push(node);
      this.textContent += node.textContent || "";
      return node;
    },
    addEventListener() {},
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
  };
}

test("roster list marks stale cached summaries as warning", () => {
  assert.equal(rosterValidationBadgeClass("valid"), "ok");
  assert.equal(rosterValidationBadgeClass("outdated"), "warning");
  assert.equal(rosterValidationBadgeClass("invalid"), "error");
  assert.equal(rosterValidationBadgeClass("unknown"), "error");
});

test("roster list presents validation states as user-facing labels", () => {
  assert.equal(rosterValidationBadgeLabel("valid"), "Valid");
  assert.equal(rosterValidationBadgeLabel("outdated"), "Outdated");
  assert.equal(rosterValidationBadgeLabel("invalid"), "Invalid");
  assert.equal(rosterValidationBadgeLabel("unknown"), "Invalid");
});

test("roster list formats points consistently with roster detail", () => {
  assert.equal(rosterPointsLabel(285, 2000), "285 / 2000");
  assert.equal(rosterPointsLabel(80, 0), "80");
  assert.equal(rosterPointsLabel(80, null), "80");
});

test("roster row renders polished validation and points labels", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const row = rosterLine({ name: "Black Crusade" }, () => {}, () => ({
      battleSizeName: "Strike Force",
      detachmentBadges: [{ disposition: "Take and Hold", name: "Veterans" }],
      detachmentCount: 1,
      factionName: "Heretic Astartes",
      pointsLimit: 2000,
      pointsTotal: 285,
      unitCount: 2,
      validationState: "valid",
    }));

    assert.equal(row.className, "builder-row roster-row");
    assert.ok(row.textContent.includes("Black Crusade"));
    assert.ok(row.textContent.includes("Valid"));
    assert.ok(row.textContent.includes("285 / 2000"));
    assert.equal(row.textContent.includes("valid"), false);
  } finally {
    global.document = previousDocument;
  }
});

test("roster list uses detachment disposition badge classes", () => {
  assert.equal(
    rosterDetachmentBadgeClass("Take and Hold"),
    "disposition-badge disposition-take-and-hold"
  );
  assert.equal(rosterDetachmentBadgeClass(""), "meta-badge");
});
