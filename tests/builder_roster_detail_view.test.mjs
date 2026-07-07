import assert from "node:assert/strict";
import test from "node:test";

global.document = { querySelector: () => null };

import {
  availableDatasheets,
  battleSizeNamed,
  factionNamed,
  realCatalog,
  state,
} from "./builder_validation_helpers.mjs";
import { rosterWithAddedUnit } from "../HereticBuilder/static/builder_roster_actions.js";

const {
  rosterDetailHasValidationMessages,
  rosterDetailStickyActionDescriptors,
  rosterValidationActionTarget,
  scrollToRosterFocusTarget,
} = await import("../HereticBuilder/static/builder_roster_detail_view.js");
const { validationActionLabel } = await import("../HereticBuilder/static/builder_roster_validation_actions.js");

test("roster validation actions prefer exact scoped editor targets", () => {
  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "warlord.invalid",
      detachmentIds: [],
      unitIds: ["unit-1"],
    }),
    { focusTarget: "warlord", kind: "unit", text: "Open Unit", unitId: "unit-1" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "roster.detachment_not_allowed",
      detachmentIds: ["detachment-1"],
      unitIds: [],
    }),
    { detachmentId: "detachment-1", kind: "detachmentCodex", text: "Codex" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: ["attachment-1"],
      code: "attached_unit.invalid_pairing",
      detachmentIds: [],
      unitIds: [],
    }),
    { attribute: "attachment-id", kind: "row", text: "Show", value: "attachment-1" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: ["attachment-1"],
      code: "attached_unit.must_be_attached",
      detachmentIds: [],
      unitIds: ["unit-1"],
    }),
    { attribute: "attachment-id", kind: "row", text: "Show", value: "attachment-1" }
  );
});

test("roster detail sticky actions only show Issues when validation has messages", () => {
  assert.equal(rosterDetailHasValidationMessages({ messages: [] }), false);
  assert.equal(rosterDetailHasValidationMessages({ messages: [{ level: "warning" }] }), true);

  assert.deepEqual(
    rosterDetailStickyActionDescriptors({ messages: [] }),
    [
      { ariaLabel: "Add detachment", label: "+ Detach", target: "detachments" },
      { ariaLabel: "Add unit", label: "+ Unit", target: "units" },
    ]
  );

  assert.deepEqual(
    rosterDetailStickyActionDescriptors({
      messages: [{ code: "roster.empty", level: "warning", text: "Roster has no units." }],
    }, { hasAttachments: true }),
    [
      { ariaLabel: "Review roster issues", label: "Issues", target: "validation" },
      { ariaLabel: "Add detachment", label: "+ Detach", target: "detachments" },
      { ariaLabel: "Add unit", label: "+ Unit", target: "units" },
      { ariaLabel: "Add attached unit", label: "Attach", target: "attachments" },
    ]
  );
});

test("roster validation action labels include the destination context", () => {
  assert.equal(
    validationActionLabel(
      { kind: "unit", text: "Open Unit" },
      { texts: ["Chosen has too many models."] },
      { unit: { name: "Chosen" } }
    ),
    "Open unit: Chosen"
  );
  assert.equal(
    validationActionLabel(
      { kind: "unitSearch", text: "Find" },
      { texts: ["Add a required Warlord."] },
      { query: "Abaddon the Despoiler" }
    ),
    "Find unit: Abaddon the Despoiler"
  );
  assert.equal(
    validationActionLabel(
      { kind: "target", text: "Detachments" },
      { texts: ["Pick a detachment."] }
    ),
    "Detachments: Pick a detachment."
  );
});

test("roster validation actions preserve unit-detail focus targets", () => {
  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "wargear_loadout.invalid_model_wargear",
      detachmentIds: [],
      targetIds: ["model-1"],
      unitIds: ["unit-1"],
    }),
    { focusTarget: "wargear:model-1", kind: "unit", text: "Open Unit", unitId: "unit-1" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "enhancement.model_does_not_have_required_keywords",
      detachmentIds: [],
      targetIds: ["model-1"],
      unitIds: ["unit-1"],
    }),
    { focusTarget: "enhancement:model-1", kind: "unit", text: "Open Unit", unitId: "unit-1" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "unit_composition.unavailable",
      detachmentIds: [],
      unitIds: ["unit-1"],
    }),
    { focusTarget: "composition", kind: "unit", text: "Open Unit", unitId: "unit-1" }
  );
});

test("roster validation actions handle roster-level issues without scopes", () => {
  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "warlord.not_selected",
      detachmentIds: [],
      unitIds: [],
    }),
    { kind: "target", target: "warlord", text: "Pick" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "roster.detachment_not_selected",
      detachmentIds: [],
      unitIds: [],
    }),
    { kind: "target", target: "detachments", text: "Detachments" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "roster.points_limit_exceeded",
      detachmentIds: [],
      unitIds: [],
    }),
    { kind: "target", target: "units", text: "Units" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "roster.empty",
      detachmentIds: [],
      unitIds: [],
    }),
    { kind: "target", target: "units", text: "Units" }
  );
});

test("roster Warlord validation action routes to Units when no Warlord target is selectable", () => {
  const previousCatalog = state.catalog;
  state.catalog = realCatalog;

  try {
    const faction = factionNamed("Adeptus Astartes");
    const roster = {
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [],
      factionKeywordId: faction.id,
      units: [],
    };
    const aggressors = availableDatasheets(roster, "native")
      .find((datasheet) => datasheet.name === "Aggressor Squad");
    assert.ok(aggressors);
    const rosterWithAggressors = rosterWithAddedUnit(roster, {
      datasheetId: aggressors.id,
      unitId: "unit-1",
    });

    assert.deepEqual(
      rosterValidationActionTarget({
        attachmentIds: [],
        code: "warlord.not_selected",
        detachmentIds: [],
        unitIds: [],
      }, { roster: rosterWithAggressors }),
      { kind: "target", target: "units", text: "Units" }
    );
  } finally {
    state.catalog = previousCatalog;
  }
});

test("roster validation actions route broad rule families to useful editors", () => {
  for (const code of [
    "allied_units.required_warlord_missing",
    "mandatory_warlord.detachment_not_selected",
    "mandatory_warlord.not_selected",
    "mandatory_warlord.supreme_commander_not_selected",
    "warlord.invalid_generic",
    "warlord.multiple_selected",
  ]) {
    assert.deepEqual(
      rosterValidationActionTarget({ attachmentIds: [], code, detachmentIds: [], unitIds: [] }),
      { kind: "target", target: "warlord", text: "Pick" },
      code
    );
  }

  for (const code of [
    "allied_unit.required_detachment_not_selected",
    "allegiance_ability.required_detachment_missing",
    "enhancement.required_detachment_missing",
    "roster.detachment_missing",
  ]) {
    assert.deepEqual(
      rosterValidationActionTarget({ attachmentIds: [], code, detachmentIds: [], unitIds: [] }),
      { kind: "target", target: "detachments", text: "Detachments" },
      code
    );
    assert.deepEqual(
      rosterValidationActionTarget({ attachmentIds: [], code, detachmentIds: [], unitIds: ["unit-1"] }),
      { kind: "target", target: "detachments", text: "Detachments" },
      `${code} with unit scope`
    );
  }

  for (const code of [
    "allegiance_ability.group_limit_exceeded",
    "allied_keyword_count.limit_exceeded",
    "enhancement.roster_has_too_many_enhancements",
    "keyword_restriction_group.limit_zero",
    "mandatory_warlord.not_present_in_roster",
  ]) {
    assert.deepEqual(
      rosterValidationActionTarget({ attachmentIds: [], code, detachmentIds: [], unitIds: [] }),
      { kind: "target", target: "units", text: "Units" },
      code
    );
  }
});

test("roster validation code actions can override detachment codex links", () => {
  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "detachment.datasheets_missing",
      datasheetIds: ["datasheet-1"],
      detachmentIds: ["detachment-1"],
      unitIds: [],
    }),
    { datasheetId: "datasheet-1", kind: "unitSearch", text: "Find" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "mandatory_warlord.not_present_in_roster",
      datasheetIds: ["warlord-datasheet"],
      detachmentIds: [],
      unitIds: [],
    }),
    { datasheetId: "warlord-datasheet", kind: "unitSearch", text: "Find" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "keyword_restriction_group.minimum_not_met",
      detachmentIds: ["detachment-1"],
      unitIds: [],
    }),
    { kind: "target", target: "units", text: "Units" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "roster.detachment_points_limit_exceeded",
      detachmentIds: ["detachment-1"],
      unitIds: [],
    }),
    { kind: "target", target: "detachments", text: "Detachments" }
  );
});

test("roster validation code actions can override unit scopes", () => {
  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "mandatory_warlord.not_selected",
      detachmentIds: [],
      unitIds: ["mandatory-unit"],
    }),
    { kind: "target", target: "warlord", text: "Pick" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "allied_units.required_warlord_missing",
      detachmentIds: [],
      unitIds: ["allied-unit"],
    }),
    { kind: "target", target: "warlord", text: "Pick" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "allied_unit.required_detachment_not_selected",
      detachmentIds: [],
      unitIds: ["allied-unit"],
    }),
    { kind: "target", target: "detachments", text: "Detachments" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "warlord.multiple_selected",
      detachmentIds: [],
      unitIds: ["warlord-1", "warlord-2"],
    }),
    { kind: "target", target: "warlord", text: "Pick" }
  );
});

test("roster validation actions point multi-scope groups to list editors", () => {
  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "duplicate",
      detachmentIds: [],
      unitIds: ["unit-1", "unit-2"],
    }),
    { kind: "target", target: "units", text: "Units" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: [],
      code: "dp",
      detachmentIds: ["detachment-1", "detachment-2"],
      unitIds: [],
    }),
    { kind: "target", target: "detachments", text: "Detachments" }
  );

  assert.deepEqual(
    rosterValidationActionTarget({
      attachmentIds: ["attachment-1", "attachment-2"],
      code: "attached",
      detachmentIds: [],
      unitIds: [],
    }),
    { kind: "target", target: "attachments", text: "Attached" }
  );
});

function fakeClassList() {
  const calls = [];
  return {
    calls,
    add(name) {
      calls.push(["add", name]);
    },
    remove(name) {
      calls.push(["remove", name]);
    },
  };
}

test("roster focus target can prefill the unit search field", () => {
  const previousDocument = global.document;
  const previousWindow = global.window;
  const previousCss = global.CSS;
  const previousEvent = global.Event;
  const calls = [];
  const classList = fakeClassList();
  const search = {
    value: "",
    dispatchEvent(event) {
      calls.push(["input", event.type]);
    },
    focus(options) {
      calls.push(["focus", options]);
    },
    scrollIntoView(options) {
      calls.push(["scroll", options]);
    },
  };
  const section = {
    classList,
    matches() {
      return false;
    },
    querySelector(selector) {
      return selector === "[data-focus-target]" ? search : null;
    },
  };

  global.CSS = { escape: (value) => value };
  global.Event = class {
    constructor(type) {
      this.type = type;
    }
  };
  global.window = {
    CSS: global.CSS,
    setTimeout(handler) {
      calls.push(["timeout", 900]);
      handler();
    },
  };
  global.document = {
    querySelector(selector) {
      return selector === '[data-editor-target="units"]' ? section : null;
    },
  };

  try {
    scrollToRosterFocusTarget("unitSearch:Abaddon the Despoiler");

    assert.equal(search.value, "Abaddon the Despoiler");
    assert.deepEqual(calls[0], ["input", "input"]);
    assert.deepEqual(calls[1], ["scroll", { behavior: "smooth", block: "center" }]);
    assert.deepEqual(calls[2], ["focus", { preventScroll: true }]);
    assert.deepEqual(classList.calls, [
      ["add", "is-attention-target"],
      ["remove", "is-attention-target"],
    ]);
  } finally {
    global.document = previousDocument;
    global.window = previousWindow;
    global.CSS = previousCss;
    global.Event = previousEvent;
  }
});

test("roster focus target opens and focuses rename form", () => {
  const previousDocument = global.document;
  const previousWindow = global.window;
  const previousCss = global.CSS;
  const calls = [];
  const classList = fakeClassList();
  const input = {
    focus(options) {
      calls.push(["focus", options]);
    },
    scrollIntoView(options) {
      calls.push(["scroll", options]);
    },
  };
  const renameForm = {
    classList,
    matches() {
      return false;
    },
    querySelector(selector) {
      return selector === "[data-focus-target]" ? input : null;
    },
  };
  const renameButton = {
    click() {
      calls.push(["clickRename"]);
    },
  };

  global.CSS = { escape: (value) => value };
  global.window = {
    CSS: global.CSS,
    setTimeout(handler) {
      calls.push(["timeout", 900]);
      handler();
    },
  };
  global.document = {
    querySelector(selector) {
      if (selector === ".rename-roster-button") {
        return renameButton;
      }
      return selector === '[data-editor-target="rename"]' ? renameForm : null;
    },
  };

  try {
    scrollToRosterFocusTarget("rename");

    assert.deepEqual(calls[0], ["clickRename"]);
    assert.deepEqual(calls[1], ["scroll", { behavior: "smooth", block: "center" }]);
    assert.deepEqual(calls[2], ["focus", { preventScroll: true }]);
    assert.deepEqual(classList.calls, [
      ["add", "is-attention-target"],
      ["remove", "is-attention-target"],
    ]);
  } finally {
    global.document = previousDocument;
    global.window = previousWindow;
    global.CSS = previousCss;
  }
});
