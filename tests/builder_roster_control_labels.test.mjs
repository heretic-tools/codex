import assert from "node:assert/strict";
import test from "node:test";
import {
  ADD_ATTACHED_UNIT_LABEL,
  ADD_DETACHMENT_LABEL,
  ADD_UNIT_LABEL,
  ATTACHED_UNIT_SELECT_LABEL,
  ATTACHMENT_BODYGUARD_SELECT_LABEL,
  ATTACHMENT_TYPE_SELECT_LABEL,
  DETACHMENT_SELECT_LABEL,
  SEARCH_CLEAR_LABEL,
  UNIT_SELECT_LABEL,
  labelControl,
  searchControlLabel,
} from "../HereticBuilder/static/builder_roster_control_labels.js";

test("roster control labels name inline search controls", () => {
  assert.equal(searchControlLabel("units"), "Search units");
  assert.equal(searchControlLabel("detachments"), "Search detachments");
  assert.equal(SEARCH_CLEAR_LABEL, "Clear search");
});

test("roster control labels name generic selects and add buttons", () => {
  assert.equal(ADD_ATTACHED_UNIT_LABEL, "Add attached unit");
  assert.equal(ADD_DETACHMENT_LABEL, "Add detachment");
  assert.equal(ADD_UNIT_LABEL, "Add unit");
  assert.equal(ATTACHED_UNIT_SELECT_LABEL, "Choose attached unit");
  assert.equal(ATTACHMENT_BODYGUARD_SELECT_LABEL, "Choose bodyguard unit");
  assert.equal(ATTACHMENT_TYPE_SELECT_LABEL, "Choose attachment type");
  assert.equal(DETACHMENT_SELECT_LABEL, "Choose detachment");
  assert.equal(UNIT_SELECT_LABEL, "Choose unit");
});

test("label control mirrors the label into title and aria-label", () => {
  const attributes = new Map();
  const node = {
    setAttribute: (name, value) => attributes.set(name, value),
    title: "",
  };

  assert.equal(labelControl(node, "Choose unit"), node);
  assert.equal(node.title, "Choose unit");
  assert.equal(attributes.get("aria-label"), "Choose unit");
});
