import assert from "node:assert/strict";
import test from "node:test";
import {
  editorMessages,
  messageMatchesUnitEditor,
  validationForUnitEditor,
} from "../HereticBuilder/static/builder_roster_unit_editor_validation_view.js";

test("unit editor validation routes messages to matching controls", () => {
  assert.equal(messageMatchesUnitEditor({ code: "unit_composition.unavailable" }, "composition"), true);
  assert.equal(messageMatchesUnitEditor({ code: "unit.max_model_count_too_many_models" }, "composition"), true);
  assert.equal(messageMatchesUnitEditor({ code: "allegiance_ability.not_selected" }, "allegiance"), true);
  assert.equal(messageMatchesUnitEditor({ code: "enhancement.model_does_not_have_required_keywords" }, "enhancements"), true);
  assert.equal(messageMatchesUnitEditor({ code: "warlord.invalid_due_to_enhancement" }, "enhancements"), true);
  assert.equal(messageMatchesUnitEditor({ code: "warlord.invalid_due_to_enhancement" }, "warlord"), false);
  assert.equal(messageMatchesUnitEditor({ code: "warlord.invalid_generic" }, "warlord"), true);
  assert.equal(messageMatchesUnitEditor({ code: "mandatory_warlord.not_selected" }, "warlord"), true);
  assert.equal(messageMatchesUnitEditor({ code: "wargear_loadout.invalid_model_wargear" }, "composition"), false);
});

test("unit editor validation keeps model enhancement messages on their target select", () => {
  const validation = {
    state: "invalid",
    messages: [
      { code: "enhancement.unit_has_too_many_enhancements", level: "error", scope: { unitId: "unit-1" } },
      { code: "enhancement.model_does_not_have_required_keywords", level: "error", scope: { targetId: "model-1" } },
      { code: "enhancement.model_must_not_have_excluded_keywords", level: "error", scope: { targetIds: ["model-2"] } },
      { code: "warlord.invalid_due_to_enhancement", level: "error", scope: { targetId: "model-1" } },
      { code: "warlord.invalid_generic", level: "error", scope: { targetId: "model-1" } },
    ],
  };

  assert.deepEqual(
    editorMessages(validation, "enhancements").map((message) => message.code),
    ["enhancement.unit_has_too_many_enhancements"]
  );
  assert.deepEqual(
    editorMessages(validation, "enhancements", "model-1").map((message) => message.code),
    [
      "enhancement.model_does_not_have_required_keywords",
      "warlord.invalid_due_to_enhancement",
    ]
  );
  assert.deepEqual(
    editorMessages(validation, "warlord").map((message) => message.code),
    ["warlord.invalid_generic"]
  );
});

test("unit editor validation returns valid empty scopes for missing validation", () => {
  const scoped = validationForUnitEditor(null, "warlord");
  assert.equal(scoped.state, "valid");
  assert.deepEqual(scoped.messages, []);
});
