import assert from "node:assert/strict";
import test from "node:test";

global.document = { querySelector: () => null };

const { unitValidationActionTarget } = await import("../HereticBuilder/static/builder_roster_unit_detail_view.js");

test("unit validation actions route diagnostics to unit detail editors", () => {
  const cases = [
    ["wargear_loadout.invalid_model_wargear", { target: "wargear", text: "Wargear" }],
    ["enhancement.model_does_not_have_required_wargear", { target: "enhancements", text: "Enhancements" }],
    ["warlord.invalid_due_to_enhancement", { target: "enhancements", text: "Enhancements" }],
    ["allegiance_ability.missing_wargear_item", { target: "allegiance", text: "Ability" }],
    ["warlord.invalid_generic", { target: "warlord", text: "Warlord" }],
    ["mandatory_warlord.not_selected", { target: "warlord", text: "Warlord" }],
    ["unit_composition.unavailable", { target: "composition", text: "Composition" }],
    ["unit.max_model_count_too_many_models", { target: "composition", text: "Composition" }],
  ];

  for (const [code, expected] of cases) {
    assert.deepEqual(unitValidationActionTarget({ code }), expected, code);
  }
});

test("unit validation actions ignore diagnostics without a local editor", () => {
  assert.equal(unitValidationActionTarget({ code: "roster.unit_limit_exceeded" }), null);
  assert.equal(unitValidationActionTarget({ code: "attached_unit.must_be_attached" }), null);
});

test("unit validation actions route target-scoped wargear diagnostics to the model section", () => {
  assert.deepEqual(
    unitValidationActionTarget({
      code: "wargear_loadout.invalid_miniature_wargear_loadout",
      targetIds: ["model-1"],
    }),
    { target: "wargear:model-1", text: "Wargear" }
  );
});

test("unit validation actions route target-scoped enhancement diagnostics to the model select", () => {
  assert.deepEqual(
    unitValidationActionTarget({
      code: "enhancement.model_does_not_have_required_keywords",
      targetIds: ["model-1"],
    }),
    { target: "enhancement:model-1", text: "Enhancements" }
  );
});
