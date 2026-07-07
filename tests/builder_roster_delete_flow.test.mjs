import assert from "node:assert/strict";
import test from "node:test";

global.document = {
  getElementById: () => ({ appendChild() {}, textContent: "" }),
  querySelector: () => null,
};

const { state } = await import("../HereticBuilder/static/builder_state.js");
const { shouldRenderAfterDelete } = await import("../HereticBuilder/static/builder_roster_io_actions.js");

test("roster list delete rerenders when the hash route does not change", () => {
  state.route = { focusTarget: "", name: "list", rosterId: "" };

  assert.equal(shouldRenderAfterDelete({ id: "ROSTER-1" }), true);
});

test("current roster delete navigates away from the deleted route", () => {
  state.route = { focusTarget: "", name: "roster", rosterId: "ROSTER-1" };

  assert.equal(shouldRenderAfterDelete({ id: "ROSTER-1" }), false);

  state.route = { focusTarget: "", name: "unit", rosterId: "ROSTER-1", unitId: "UNIT-1" };

  assert.equal(shouldRenderAfterDelete({ id: "ROSTER-1" }), false);
});

test("delete without a current list route keeps the navigation fallback", () => {
  state.route = { focusTarget: "", name: "create", rosterId: "" };

  assert.equal(shouldRenderAfterDelete({ id: "ROSTER-1" }), false);
  assert.equal(shouldRenderAfterDelete({}), false);
});
