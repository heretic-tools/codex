import assert from "node:assert/strict";
import test from "node:test";

import {
  rosterDetachmentBadgeClass,
  rosterValidationBadgeClass,
} from "../HereticBuilder/static/builder_roster_list_view.js";

test("roster list marks stale cached summaries as warning", () => {
  assert.equal(rosterValidationBadgeClass("valid"), "ok");
  assert.equal(rosterValidationBadgeClass("outdated"), "warning");
  assert.equal(rosterValidationBadgeClass("invalid"), "error");
  assert.equal(rosterValidationBadgeClass("unknown"), "error");
});

test("roster list uses detachment disposition badge classes", () => {
  assert.equal(
    rosterDetachmentBadgeClass("Take and Hold"),
    "disposition-badge disposition-take-and-hold"
  );
  assert.equal(rosterDetachmentBadgeClass(""), "meta-badge");
});
