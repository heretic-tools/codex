import assert from "node:assert/strict";
import test from "node:test";

global.document = { querySelector: () => null };

const {
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
