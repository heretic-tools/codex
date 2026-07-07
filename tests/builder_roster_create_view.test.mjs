import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultRosterName,
  nextRosterNumberForFaction,
  renderRosterCreateView,
  rosterNumberFromName,
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
    onSubmit: () => {},
    ...options,
  });
}

test("roster create view derives default names from faction and free local number", async () => {
  assert.equal(rosterNumberFromName("Heretic Astartes roster 3", "Heretic Astartes"), 3);
  assert.equal(rosterNumberFromName("Heretic Astartes ROSTER 4", "Heretic Astartes"), 4);
  assert.equal(rosterNumberFromName("Custom Heretic Astartes roster 3", "Heretic Astartes"), 0);
  assert.equal(defaultRosterName("Heretic Astartes"), "Heretic Astartes roster 1");
  assert.equal(defaultRosterName(""), "New roster 1");
  assert.equal(
    nextRosterNumberForFaction([
      { factionKeywordId: "heretic-astartes", name: "Heretic Astartes roster 1" },
      { factionKeywordId: "heretic-astartes", name: "Heretic Astartes roster 3" },
      { factionKeywordId: "adeptus-astartes", name: "Adeptus Astartes roster 2" },
      { factionKeywordId: "heretic-astartes", name: "Custom name" },
    ], "heretic-astartes", "Heretic Astartes"),
    2
  );

  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const form = createView({
      rosters: [
        { factionKeywordId: "heretic-astartes", name: "Heretic Astartes roster 1" },
        { factionKeywordId: "adeptus-astartes", name: "Adeptus Astartes roster 1" },
        { factionKeywordId: "adeptus-astartes", name: "Adeptus Astartes roster 2" },
      ],
    });
    const nameField = form.children[0];
    const factionField = form.children[1];
    const nameInput = nameField.children[1];
    const factionSelect = factionField.children[1];

    assert.equal(nameInput.value, "Heretic Astartes roster 2");
    factionSelect.value = "adeptus-astartes";
    await factionSelect.dispatch("change");
    assert.equal(nameInput.value, "Adeptus Astartes roster 3");

    nameInput.value = "My list";
    await nameInput.dispatch("input");
    factionSelect.value = "heretic-astartes";
    await factionSelect.dispatch("change");
    assert.equal(nameInput.value, "My list");
  } finally {
    global.document = previousDocument;
  }
});

test("roster create view keeps the form focused on confirmation", async () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const form = createView();
    const actions = form.children[3];

    assert.equal(actions.className, "form-actions");
    assert.equal(actions.children.length, 1);
    assert.equal(actions.children[0].textContent, "Confirm");
    assert.equal(actions.children[0].title, "Confirm roster setup");
    assert.equal(actions.children[0].attributes.get("aria-label"), "Confirm roster setup");
    assert.equal(form.textContent.includes("Back"), false);
  } finally {
    global.document = previousDocument;
  }
});

test("roster create view uses battle size radio choices for submit state", async () => {
  const previousDocument = global.document;
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
    const picker = form.children[2];
    const options = picker.children[1];
    const incursionLabel = options.children[0];
    const incursionInput = incursionLabel.children[0];
    const strikeLabel = options.children[1];
    const strikeInput = strikeLabel.children[0];

    assert.equal(picker.tagName, "fieldset");
    assert.equal(form.autocomplete, "off");
    assert.equal(strikeInput.autocomplete, "off");
    assert.equal(strikeInput.checked, true);
    assert.equal(strikeLabel.className, "battle-size-option is-selected");

    incursionInput.checked = true;
    await incursionInput.dispatch("change");
    assert.equal(incursionInput.checked, true);
    assert.equal(strikeInput.checked, false);
    assert.equal(incursionLabel.className, "battle-size-option is-selected");

    await form.dispatch("submit", { preventDefault() {} });
    assert.equal(submitted.battleSizeId, "incursion");
  } finally {
    global.document = previousDocument;
  }
});

test("roster create view submit falls back to the generated name", async () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    let submitted = null;
    const form = createView({
      onSubmit: (value) => {
        submitted = value;
      },
      rosters: [
        { factionKeywordId: "heretic-astartes", name: "Heretic Astartes roster 1" },
      ],
    });
    const nameInput = form.children[0].children[1];
    nameInput.value = "   ";

    await form.dispatch("submit", { preventDefault() {} });

    assert.deepEqual(submitted, {
      battleSizeId: "strike-force",
      factionKeywordId: "heretic-astartes",
      name: "Heretic Astartes roster 2",
    });
  } finally {
    global.document = previousDocument;
  }
});
