import assert from "node:assert/strict";
import test from "node:test";

global.document = { querySelector: () => null };

const {
  renderRosterStickySummary,
  rosterOverviewStateClass,
  rosterOverviewStatusLabel,
} = await import("../HereticBuilder/static/builder_roster_overview_view.js");

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
