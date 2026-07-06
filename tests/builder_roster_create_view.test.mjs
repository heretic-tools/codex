import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultRosterName,
  renderRosterCreateView,
  rosterNameDate,
} from "../HereticBuilder/static/builder_roster_create_view.js";

function createMockElement(tagName) {
  return {
    attributes: new Map(),
    autofocus: false,
    autocomplete: "",
    children: [],
    className: "",
    disabled: false,
    listeners: new Map(),
    maxLength: 0,
    name: "",
    placeholder: "",
    tagName,
    textContent: "",
    type: "",
    value: "",
    append(...nodes) {
      for (const node of nodes) {
        this.appendChild(node);
      }
    },
    appendChild(node) {
      this.children.push(node);
      this.lastChild = node;
      this.textContent += node.textContent || "";
      return node;
    },
    addEventListener(name, handler) {
      this.listeners.set(name, handler);
    },
    async dispatch(name, event = {}) {
      return this.listeners.get(name)?.(event);
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
  };
}

function createView(options = {}) {
  return renderRosterCreateView({
    battleSizes: [
      { id: "incursion", name: "Incursion", pointsLimit: 1000 },
      { id: "strike-force", name: "Strike Force", pointsLimit: 2000 },
    ],
    defaultBattleSizeId: "strike-force",
    defaultFactionId: "heretic-astartes",
    factions: [
      { id: "adeptus-astartes", name: "Adeptus Astartes" },
      { id: "heretic-astartes", name: "Heretic Astartes" },
    ],
    onBack: () => {},
    onSubmit: () => {},
    ...options,
  });
}

test("roster create view derives default names from faction and date", async () => {
  assert.equal(rosterNameDate(new Date("2026-07-06T12:00:00Z")), "2026-07-06");
  assert.equal(defaultRosterName("Heretic Astartes", new Date("2026-07-06T12:00:00Z")), "Heretic Astartes Roster 2026-07-06");
  assert.equal(defaultRosterName("", Number.NaN), "New Roster");

  const previousDocument = global.document;
  const previousDate = global.Date;
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : ["2026-07-06T12:00:00Z"]));
    }

    static now() {
      return new Date("2026-07-06T12:00:00Z").getTime();
    }
  }
  global.Date = FixedDate;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const form = createView();
    const nameField = form.children[0];
    const factionField = form.children[1];
    const nameInput = nameField.children[1];
    const factionSelect = factionField.children[1];

    assert.equal(nameInput.value, "Heretic Astartes Roster 2026-07-06");
    factionSelect.value = "adeptus-astartes";
    await factionSelect.dispatch("change");
    assert.equal(nameInput.value, "Adeptus Astartes Roster 2026-07-06");

    nameInput.value = "My list";
    await nameInput.dispatch("input");
    factionSelect.value = "heretic-astartes";
    await factionSelect.dispatch("change");
    assert.equal(nameInput.value, "My list");
  } finally {
    global.Date = previousDate;
    global.document = previousDocument;
  }
});

test("roster create view submit falls back to the generated name", async () => {
  const previousDocument = global.document;
  const previousDate = global.Date;
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : ["2026-07-06T12:00:00Z"]));
    }
  }
  global.Date = FixedDate;
  global.document = {
    createElement: createMockElement,
  };

  try {
    let submitted = null;
    const form = createView({
      onSubmit: (value) => {
        submitted = value;
      },
    });
    const nameInput = form.children[0].children[1];
    nameInput.value = "   ";

    await form.dispatch("submit", { preventDefault() {} });

    assert.deepEqual(submitted, {
      battleSizeId: "strike-force",
      factionKeywordId: "heretic-astartes",
      name: "Heretic Astartes Roster 2026-07-06",
    });
  } finally {
    global.Date = previousDate;
    global.document = previousDocument;
  }
});
