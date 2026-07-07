import assert from "node:assert/strict";
import test from "node:test";

import {
  compactRosterBadgeNames,
  rosterActionLabel,
  rosterDetachmentCountLabel,
  rosterLine,
  rosterListItem,
  rosterModifiedLabel,
  rosterOpenLabel,
  rosterPointsLabel,
  rosterPointsProgressClass,
  rosterPointsProgressLabel,
  rosterPointsProgressValue,
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
    listeners: new Map(),
    open: false,
    parentNode: null,
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
      node.parentNode = this;
      this.children.push(node);
      this.textContent += node.textContent || "";
      return node;
    },
    addEventListener(name, handler) {
      this.listeners.set(name, handler);
    },
    closest(selector) {
      const className = selector.startsWith(".") ? selector.slice(1) : selector;
      let node = this;
      while (node) {
        if (String(node.className || "").split(/\s+/).includes(className)) {
          return node;
        }
        node = node.parentNode;
      }
      return null;
    },
    contains(target) {
      let node = target;
      while (node) {
        if (node === this) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    },
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

test("roster list derives visual points progress without changing roster data", () => {
  assert.equal(rosterPointsProgressValue(285, 2000), 14.3);
  assert.equal(rosterPointsProgressValue(2000, 2000), 100);
  assert.equal(rosterPointsProgressValue(2300, 2000), 100);
  assert.equal(rosterPointsProgressValue(80, 0), 0);
  assert.equal(rosterPointsProgressClass(0, 2000), "empty");
  assert.equal(rosterPointsProgressClass(285, 2000), "ok");
  assert.equal(rosterPointsProgressClass(1800, 2000), "warning");
  assert.equal(rosterPointsProgressClass(2300, 2000), "error");
  assert.equal(rosterPointsProgressLabel(285, 2000), "285 of 2000 points used");
  assert.equal(rosterPointsProgressLabel(80, 0), "80 points");
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

test("roster list formats modified dates compactly", () => {
  assert.equal(rosterModifiedLabel("2026-07-05T10:00:00.000Z"), "Updated 2026-07-05");
  assert.equal(rosterModifiedLabel("not-a-date"), "Updated unknown");
  assert.equal(rosterModifiedLabel(""), "Updated unknown");
});

test("roster row open label names the row action", () => {
  assert.equal(rosterOpenLabel({ name: "Black Crusade" }), "Open roster: Black Crusade");
  assert.equal(rosterOpenLabel({ id: "ABCDEF12-3456", name: "Black Crusade" }), "Open roster: Black Crusade, ID ABCDEF12");
  assert.equal(rosterOpenLabel({}), "Open roster: New Roster");
  assert.equal(compactRosterBadgeNames([
    { name: "Pactbound Zealots" },
    { name: "Cabal of Chaos" },
    { name: "Soulforged Warpack" },
  ]), "Pactbound Zealots, Cabal of Chaos +1");
  assert.equal(
    rosterOpenLabel({ id: "ABCDEF12-3456", modifiedAt: "2026-07-05T10:00:00.000Z", name: "Black Crusade" }, {
      battleSizeName: "Strike Force",
      detachmentBadges: [{ name: "Pactbound Zealots" }],
      detachmentCount: 1,
      factionName: "Heretic Astartes",
      pointsLimit: 2000,
      pointsTotal: 285,
      unitCount: 2,
      validationState: "valid",
    }),
    "Open roster: Black Crusade, Heretic Astartes / Strike Force, Valid, 285 / 2000 points, Detachments: Pactbound Zealots, 1 detachment, 2 units, Updated 2026-07-05, ID ABCDEF12"
  );
});

test("roster row renders polished validation and points labels", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const row = rosterLine({
      id: "ABCDEF12-3456",
      modifiedAt: "2026-07-05T10:00:00.000Z",
      name: "Black Crusade",
    }, () => {}, () => ({
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
    assert.equal(row.title, "Open roster: Black Crusade, Heretic Astartes / Strike Force, Valid, 285 / 2000 points, Detachments: Veterans, 1 detachment, 2 units, Updated 2026-07-05, ID ABCDEF12");
    assert.equal(row.attributes.get("aria-label"), row.title);
    assert.ok(row.textContent.includes("Black Crusade"));
    assert.ok(row.textContent.includes("Valid"));
    assert.ok(row.textContent.includes("285 / 2000"));
    assert.ok(row.textContent.includes("1 detachment"));
    assert.ok(row.textContent.includes("Updated 2026-07-05"));
    assert.equal(row.textContent.includes("valid"), false);
    assert.equal(row.textContent.includes("det."), false);
    assert.equal(row.children[2].className, "roster-points-meter points-ok");
    assert.equal(row.children[2].title, "285 of 2000 points used");
    assert.equal(row.children[2].attributes.get("aria-hidden"), "true");
    assert.equal(row.children[2].attributes.get("style"), "--roster-points-progress: 14.3%");
  } finally {
    global.document = previousDocument;
  }
});

test("roster list item keeps quick actions outside the open-row button", async () => {
  const previousDocument = global.document;
  const documentListeners = new Map();
  global.document = {
    createElement: createMockElement,
    addEventListener(name, handler) {
      documentListeners.set(name, handler);
    },
    removeEventListener(name, handler) {
      if (documentListeners.get(name) === handler) {
        documentListeners.delete(name);
      }
    },
  };
  const calls = [];

  try {
    assert.equal(rosterActionLabel({ name: "Black Crusade" }, "Duplicate"), "Duplicate: Black Crusade");
    const item = rosterListItem(
      { id: "ABCDEF12-3456", name: "Black Crusade" },
      () => calls.push("open"),
      () => ({
        battleSizeName: "Strike Force",
        detachmentBadges: [],
        detachmentCount: 0,
        factionName: "Heretic Astartes",
        pointsLimit: 2000,
        pointsTotal: 0,
        unitCount: 0,
        validationState: "invalid",
      }),
      {
        onDelete: () => calls.push("delete"),
        onDuplicate: () => calls.push("duplicate"),
        onExport: () => calls.push("export"),
        onExportText: () => calls.push("exportText"),
        onRename: () => calls.push("rename"),
      }
    );

    assert.equal(item.className, "roster-list-item");
    assert.equal(item.children[0].className, "builder-row roster-row");
    assert.equal(item.children[0].tagName, "button");
    assert.equal(item.children[1].className, "roster-actions-menu");
    assert.equal(item.children[1].tagName, "details");
    assert.equal(item.children[1].children[0].className, "roster-actions-trigger");
    assert.equal(item.children[1].children[0].attributes.get("aria-label"), "More actions: Black Crusade");
    assert.equal(item.children[1].children[0].attributes.get("aria-haspopup"), "menu");
    assert.equal(item.children[1].children[0].attributes.get("aria-expanded"), "false");
    assert.equal(item.children[1].children[1].children[0].textContent, "Rename");
    assert.equal(item.children[1].children[1].children[1].textContent, "Duplicate");
    assert.equal(item.children[1].children[1].children[2].textContent, "Export JSON");
    assert.equal(item.children[1].children[1].children[3].textContent, "Export Text");
    assert.equal(item.children[1].children[1].children[4].textContent, "Delete Roster");
    assert.equal(item.children[0].children.some((child) => child.className === "roster-actions-menu"), false);

    item.children[1].open = true;
    const event = {
      stopped: false,
      stopPropagation() {
        this.stopped = true;
      },
    };
    await item.children[1].children[1].children[3].listeners.get("click")(event);
    assert.deepEqual(calls, ["exportText"]);
    assert.equal(event.stopped, true);
    assert.equal(item.children[1].open, false);

    item.children[1].open = true;
    await item.children[1].listeners.get("toggle")();
    assert.equal(item.children[1].children[0].attributes.get("aria-expanded"), "true");
    assert.equal(typeof documentListeners.get("pointerdown"), "function");
    const outsideNode = createMockElement("div");
    documentListeners.get("pointerdown")({ target: outsideNode });
    assert.equal(item.children[1].open, false);
    assert.equal(item.children[1].children[0].attributes.get("aria-expanded"), "false");
    assert.equal(documentListeners.has("pointerdown"), false);

    item.children[1].open = true;
    await item.children[1].listeners.get("toggle")();
    const keyEvent = {
      key: "Escape",
      prevented: false,
      stopped: false,
      preventDefault() {
        this.prevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    };
    await item.children[1].listeners.get("keydown")(keyEvent);
    assert.equal(item.children[1].open, false);
    assert.equal(keyEvent.prevented, true);
    assert.equal(keyEvent.stopped, true);
    assert.equal(item.children[1].children[0].attributes.get("aria-expanded"), "false");
    assert.equal(documentListeners.has("pointerdown"), false);
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
    const listItem = withRoster.children[0].children[0];
    assert.equal(listItem.className, "roster-list-item");
    assert.equal(listItem.children.length, 1);
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
