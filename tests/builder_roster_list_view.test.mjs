import assert from "node:assert/strict";
import test from "node:test";

import {
  rosterDetachmentCountLabel,
  rosterLine,
  rosterOpenLabel,
  rosterPointsLabel,
  rosterUnitCountLabel,
} from "../HereticBuilder/static/builder_roster_list_rows.js";
import {
  renderRosterListView,
  rosterDetachmentBadgeClass,
  rosterValidationBadgeClass,
  rosterValidationBadgeLabel,
} from "../HereticBuilder/static/builder_roster_list_view.js";

function createMockElement(tagName) {
  return {
    attributes: new Map(),
    children: [],
    className: "",
    disabled: false,
    hidden: false,
    tagName,
    textContent: "",
    title: "",
    type: "",
    value: "",
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

test("roster list pluralizes unit counts", () => {
  assert.equal(rosterUnitCountLabel(0), "0 units");
  assert.equal(rosterUnitCountLabel(1), "1 unit");
  assert.equal(rosterUnitCountLabel(2), "2 units");
});

test("roster list pluralizes detachment counts", () => {
  assert.equal(rosterDetachmentCountLabel(0), "0 detachments");
  assert.equal(rosterDetachmentCountLabel(1), "1 detachment");
  assert.equal(rosterDetachmentCountLabel(2), "2 detachments");
});

test("roster row open label names the row action", () => {
  assert.equal(rosterOpenLabel({ name: "Black Crusade" }), "Open roster: Black Crusade");
  assert.equal(rosterOpenLabel({}), "Open roster: New Roster");
  assert.equal(
    rosterOpenLabel({ name: "Black Crusade" }, {
      battleSizeName: "Strike Force",
      detachmentCount: 1,
      factionName: "Heretic Astartes",
      pointsLimit: 2000,
      pointsTotal: 285,
      unitCount: 2,
      validationState: "valid",
    }),
    "Open roster: Black Crusade, Heretic Astartes / Strike Force, Valid, 285 / 2000 points, 1 detachment, 2 units"
  );
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
    assert.equal(row.title, "Open roster: Black Crusade, Heretic Astartes / Strike Force, Valid, 285 / 2000 points, 1 detachment, 2 units");
    assert.equal(row.attributes.get("aria-label"), row.title);
    assert.ok(row.textContent.includes("Black Crusade"));
    assert.ok(row.textContent.includes("Valid"));
    assert.ok(row.textContent.includes("285 / 2000"));
    assert.ok(row.textContent.includes("1 detachment"));
    assert.equal(row.textContent.includes("valid"), false);
    assert.equal(row.textContent.includes("det."), false);
  } finally {
    global.document = previousDocument;
  }
});

test("roster list disables export while there are no local rosters", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const empty = renderRosterListView({
      onCreate: () => {},
      onExport: () => {},
      onImport: () => {},
      onOpen: () => {},
      rosters: [],
      summarizeRoster: () => ({}),
    });
    const emptyTransfer = empty.children[2];
    assert.equal(empty.children[0].children[0].textContent, "No rosters yet");
    assert.equal(empty.children[1].title, "Create roster");
    assert.equal(empty.children[1].attributes.get("aria-label"), "Create roster");
    assert.equal(emptyTransfer.children[0].textContent, "Export Rosters");
    assert.equal(emptyTransfer.children[0].disabled, true);
    assert.equal(emptyTransfer.children[0].title, "Export rosters");
    assert.equal(emptyTransfer.children[0].attributes.get("aria-label"), "Export rosters");
    assert.equal(emptyTransfer.children[1].textContent, "Import Rosters");
    assert.equal(emptyTransfer.children[1].disabled, false);
    assert.equal(emptyTransfer.children[1].title, "Import rosters");
    assert.equal(emptyTransfer.children[1].attributes.get("aria-label"), "Import rosters");

    const withRoster = renderRosterListView({
      onCreate: () => {},
      onExport: () => {},
      onImport: () => {},
      onOpen: () => {},
      rosters: [{ id: "roster-1", name: "Roster" }],
      summarizeRoster: () => ({
        battleSizeName: "Strike Force",
        detachmentBadges: [],
        detachmentCount: 0,
        factionName: "Heretic Astartes",
        pointsLimit: 2000,
        pointsTotal: 0,
        unitCount: 0,
        validationState: "invalid",
      }),
    });
    assert.equal(withRoster.children[2].children[0].disabled, false);
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
