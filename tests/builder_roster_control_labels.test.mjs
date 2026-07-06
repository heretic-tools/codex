import assert from "node:assert/strict";
import test from "node:test";
import {
  SEARCH_CLEAR_LABEL,
  searchControlLabel,
} from "../HereticBuilder/static/builder_roster_control_labels.js";

test("roster control labels name inline search controls", () => {
  assert.equal(searchControlLabel("units"), "Search units");
  assert.equal(searchControlLabel("detachments"), "Search detachments");
  assert.equal(SEARCH_CLEAR_LABEL, "Clear search");
});
