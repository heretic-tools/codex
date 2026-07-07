import assert from "node:assert/strict";
import test from "node:test";

global.document = { querySelector: () => null };

const {
  renderRosterOverview,
  renderRosterStickySummary,
  rosterOverviewStateClass,
  rosterOverviewStatusLabel,
} = await import("../HereticBuilder/static/builder_roster_overview_view.js");

function createMockElement(tagName) {
  return {
    attributes: new Map(),
    children: [],
    className: "",
    dataset: {},
    tagName,
    textContent: "",
    title: "",
    type: "",
    append(...nodes) {
      for (const node of nodes) {
        this.appendChild(node);
      }
    },
    appendChild(node) {
      this.children.push(node);
      this.textContent += node?.textContent || "";
      return node;
    },
    addEventListener(name, handler) {
      this.listeners ||= new Map();
      this.listeners.set(name, handler);
    },
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  };
}

test("roster overview status distinguishes errors and warnings", () => {
  assert.equal(
    rosterOverviewStateClass({ messages: [] }),
    "ok"
  );
  assert.equal(
    rosterOverviewStatusLabel({ messages: [] }),
    "Valid"
  );
  assert.equal(
    rosterOverviewStateClass({ messages: [{ level: "warning" }] }),
    "warning"
  );
  assert.equal(
    rosterOverviewStatusLabel({ messages: [{ level: "warning" }] }),
    "1 warning"
  );
  assert.equal(
    rosterOverviewStateClass({ messages: [{ level: "error" }, { level: "warning" }] }),
    "error"
  );
  assert.equal(
    rosterOverviewStatusLabel({ messages: [{ level: "error" }, { level: "warning" }] }),
    "1 error / 1 warning"
  );
});

test("roster overview hides Warlord picker before units exist", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const overview = renderRosterOverview({
      onDelete: () => {},
      onDuplicate: () => {},
      onUpdate: () => {},
      roster: { detachmentIds: [], units: [] },
      summary: { battleSizeName: "Strike Force", factionName: "Heretic Astartes" },
      validation: {
        messages: [],
        points: {
          detachmentLimit: 3,
          detachmentPoints: 0,
          limit: 2000,
          total: 0,
        },
        state: "valid",
      },
    });

    assert.equal(overview.textContent.includes("Warlord"), false);
    assert.equal(overview.textContent.includes("Add units first"), false);
    assert.ok(overview.textContent.includes("Duplicate Roster"));
    assert.ok(overview.textContent.includes("Delete Roster"));
    assert.equal(overview.children[2].children[0].title, "Duplicate roster");
    assert.equal(overview.children[2].children[0].attributes.get("aria-label"), "Duplicate roster");
    assert.equal(overview.children[2].children[1].title, "Delete roster");
    assert.equal(overview.children[2].children[1].attributes.get("aria-label"), "Delete roster");
  } finally {
    global.document = previousDocument;
  }
});

test("roster sticky summary exposes compact points and validation state", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: (tagName) => ({
      attributes: new Map(),
      children: [],
      className: "",
      dataset: {},
      tagName,
      textContent: "",
      append(...nodes) {
        this.children.push(...nodes);
      },
      appendChild(node) {
        this.children.push(node);
      },
      addEventListener(name, handler) {
        this.listeners ||= new Map();
        this.listeners.set(name, handler);
      },
      setAttribute(name, value) {
        this.attributes.set(name, value);
      },
    }),
  };

  try {
    const summary = renderRosterStickySummary({
      roster: { units: [{ id: "unit-1" }, { id: "unit-2" }] },
      validation: {
        messages: [{ level: "warning", text: "Review this." }],
        points: {
          detachmentLimit: 3,
          detachmentPoints: 1,
          limit: 2000,
          total: 465,
        },
        state: "valid",
      },
    });

    assert.equal(summary.className, "roster-sticky-summary has-validation-warning");
    assert.equal(summary.attributes.get("aria-label"), "Roster sticky summary: Valid / 1 warning");
    assert.equal(summary.children[0].textContent, "1 warning");
    assert.equal(summary.children[1].children[0].children[1].textContent, "465 / 2000");
    assert.equal(summary.children[1].children[1].children[1].textContent, "1 / 3");
    assert.equal(summary.children[1].children[2].children[1].textContent, "2");
  } finally {
    global.document = previousDocument;
  }
});

test("roster sticky summary can expose mobile section jump actions", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: (tagName) => ({
      attributes: new Map(),
      children: [],
      className: "",
      dataset: {},
      tagName,
      textContent: "",
      type: "",
      append(...nodes) {
        this.children.push(...nodes);
      },
      appendChild(node) {
        this.children.push(node);
      },
      addEventListener(name, handler) {
        this.listeners ||= new Map();
        this.listeners.set(name, handler);
      },
      setAttribute(name, value) {
        this.attributes.set(name, value);
      },
    }),
  };

  try {
    let customActionClicked = false;
    const summary = renderRosterStickySummary({
      actions: [
        { ariaLabel: "Review roster issues", label: "Issues", target: "validation" },
        { ariaLabel: "Add unit", label: "+ Unit", primary: true, target: "units" },
        {
          action: "unit-detail",
          ariaLabel: "Edit unit wargear",
          label: "Wargear",
          onClick: () => {
            customActionClicked = true;
          },
          target: "wargear",
        },
      ],
      roster: { units: [] },
      validation: {
        messages: [],
        points: {
          detachmentLimit: 3,
          detachmentPoints: 0,
          limit: 2000,
          total: 0,
        },
        state: "valid",
      },
    });

    const actions = summary.children[2];
    assert.equal(summary.className, "roster-sticky-summary has-validation-ok has-actions");
    assert.equal(actions.className, "roster-sticky-summary-actions");
    assert.equal(actions.children.length, 3);
    assert.equal(actions.children[0].className, "roster-sticky-summary-action");
    assert.equal(actions.children[0].textContent, "Issues");
    assert.equal(actions.children[0].dataset.summaryTarget, "validation");
    assert.equal(actions.children[0].dataset.summaryAction, "scroll");
    assert.equal(actions.children[0].title, "Review roster issues");
    assert.equal(actions.children[0].attributes.get("aria-label"), "Review roster issues");
    assert.equal(actions.children[1].textContent, "+ Unit");
    assert.equal(actions.children[1].dataset.summaryTarget, "units");
    assert.equal(actions.children[1].dataset.summaryAction, "primary");
    assert.equal(actions.children[1].title, "Add unit");
    assert.equal(actions.children[1].attributes.get("aria-label"), "Add unit");
    assert.equal(actions.children[2].textContent, "Wargear");
    assert.equal(actions.children[2].dataset.summaryTarget, "wargear");
    assert.equal(actions.children[2].dataset.summaryAction, "unit-detail");
    assert.equal(actions.children[2].title, "Edit unit wargear");
    assert.equal(actions.children[2].attributes.get("aria-label"), "Edit unit wargear");
    actions.children[2].listeners.get("click")();
    assert.equal(customActionClicked, true);
  } finally {
    global.document = previousDocument;
  }
});
