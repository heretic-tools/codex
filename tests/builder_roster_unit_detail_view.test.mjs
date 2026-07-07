import assert from "node:assert/strict";
import test from "node:test";

global.document = { querySelector: () => null };

const {
  stickyEnhancementsLabel,
  unitDetailStickyActionDescriptors,
  unitValidationActionTarget,
  validationHasMessages,
  validationWithoutMessages,
} = await import("../HereticBuilder/static/builder_roster_unit_detail_view.js");
const {
  miniatureWargearHeading,
  renderRosterUnitWargearSection,
  wargearScopeHasContent,
} = await import("../HereticBuilder/static/builder_roster_unit_wargear_section_view.js");
const {
  renderWargearScope,
} = await import("../HereticBuilder/static/builder_roster_unit_wargear_view.js");
const {
  renderRosterUnitOverview,
  unitOverviewLabel,
} = await import("../HereticBuilder/static/builder_roster_unit_overview_view.js");
const {
  state,
} = await import("./builder_validation_helpers.mjs");
const {
  unitValidationActionLabel,
} = await import("../HereticBuilder/static/builder_roster_unit_detail_actions.js");

function createMockElement(tagName) {
  return {
    attributes: new Map(),
    children: [],
    className: "",
    dataset: {},
    tagName,
    textContent: "",
    append(...nodes) {
      for (const node of nodes) {
        this.appendChild(node);
      }
    },
    appendChild(node) {
      this.children.push(node);
      this.textContent += node.textContent || "";
      return node;
    },
    after() {},
    querySelector() {
      return null;
    },
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  };
}

function flatNodes(node) {
  return [node, ...(node.children || []).flatMap((child) => flatNodes(child))];
}

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

test("unit detail sticky actions expose only available local sections", () => {
  assert.deepEqual(
    unitDetailStickyActionDescriptors({
      hasAllegiance: true,
      hasComposition: true,
      hasEnhancements: true,
      hasValidation: true,
      hasWargear: true,
      hasWarlord: true,
    }),
    [
      { ariaLabel: "Review unit issues", label: "Issues", target: "validation" },
      { ariaLabel: "Review unit profile", label: "Unit", target: "overview" },
      { ariaLabel: "Edit unit composition", label: "Models", target: "composition" },
      { ariaLabel: "Edit unit Warlord", label: "Warlord", target: "warlord" },
      { ariaLabel: "Edit unit ability", label: "Ability", target: "allegiance" },
      { ariaLabel: "Edit unit wargear", label: "Wargear", target: "wargear" },
      { ariaLabel: "Edit unit upgrades", label: "Upgrades", target: "enhancements" },
    ]
  );

  assert.deepEqual(
    unitDetailStickyActionDescriptors({ hasWargear: false }),
    [
      { ariaLabel: "Review unit profile", label: "Unit", target: "overview" },
    ]
  );
});

test("unit detail sticky action label follows the rendered upgrades section", () => {
  assert.equal(stickyEnhancementsLabel("Enhancements"), "Enhance");
  assert.equal(stickyEnhancementsLabel("Upgrades"), "Upgrades");
  assert.equal(stickyEnhancementsLabel("Enhancements & Upgrades"), "Upgrades");

  assert.deepEqual(
    unitDetailStickyActionDescriptors({
      hasEnhancements: true,
      enhancementsLabel: "Enhancements",
    }),
    [
      { ariaLabel: "Review unit profile", label: "Unit", target: "overview" },
      { ariaLabel: "Edit unit enhancements", label: "Enhance", target: "enhancements" },
    ]
  );

  assert.deepEqual(
    unitDetailStickyActionDescriptors({
      hasEnhancements: true,
      enhancementsLabel: "Enhancements & Upgrades",
    }),
    [
      { ariaLabel: "Review unit profile", label: "Unit", target: "overview" },
      { ariaLabel: "Edit unit enhancements & upgrades", label: "Upgrades", target: "enhancements" },
    ]
  );
});

test("unit overview exposes points and model count in its accessible label", () => {
  const previousDocument = global.document;
  const previousCatalog = state.catalog;
  global.document = {
    createElement: createMockElement,
  };
  state.catalog = {
    allegianceAbilityGroupById: new Map(),
    alliedFactionParentsByAlliedFactionId: new Map(),
    compositionMiniaturesByCompositionId: new Map(),
    compositionsByDatasheetId: new Map(),
    datasheetById: new Map(),
    detachmentById: new Map(),
    factionById: new Map(),
    factionKeywordById: new Map(),
    requiredDetachmentsByCompositionId: new Map(),
    requiredFactionKeywordsByCompositionId: new Map(),
    unitImagesByDatasheetId: new Map(),
    wargearGroupsByDatasheetId: new Map(),
  };

  try {
    const unit = {
      datasheetId: "chosen",
      id: "unit-1",
      modelCount: 5,
      name: "Chosen",
      points: 125,
    };
    const overview = renderRosterUnitOverview({
      onUpdate: () => {},
      roster: {
        detachmentIds: [],
        factionKeywordId: "heretic-astartes",
        units: [],
      },
      unit,
      validation: { messages: [] },
      validationContext: {},
    });

    assert.equal(unitOverviewLabel(unit), "Unit overview: Chosen; Points 125; Models 5");
    assert.equal(overview.attributes.get("aria-label"), "Unit overview: Chosen; Points 125; Models 5");
    assert.equal(overview.children[0].className, "unit-overview-summary");
  } finally {
    state.catalog = previousCatalog;
    global.document = previousDocument;
  }
});

test("unit validation actions ignore diagnostics without a local editor", () => {
  assert.equal(unitValidationActionTarget({ code: "roster.unit_limit_exceeded" }), null);
  assert.equal(unitValidationActionTarget({ code: "attached_unit.must_be_attached" }), null);
});

test("unit validation action labels include the validation issue text", () => {
  assert.equal(
    unitValidationActionLabel(
      { target: "wargear", text: "Wargear" },
      { texts: ["Chosen has invalid wargear."] }
    ),
    "Wargear: Chosen has invalid wargear."
  );
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

test("unit detail separates current-unit validation from other roster issues", () => {
  const unitMessage = { code: "unit.issue", level: "error", text: "unit issue" };
  const rosterWarning = { code: "roster.warning", level: "warning", text: "roster warning" };
  const rosterError = { code: "roster.error", level: "error", text: "roster error" };

  assert.deepEqual(
    validationWithoutMessages({
      messages: [unitMessage, rosterWarning, rosterError],
      state: "invalid",
    }, [unitMessage]),
    {
      messages: [rosterWarning, rosterError],
      state: "invalid",
    }
  );

  assert.deepEqual(
    validationWithoutMessages({
      messages: [unitMessage, rosterWarning],
      state: "invalid",
    }, [unitMessage]),
    {
      messages: [rosterWarning],
      state: "valid",
    }
  );
});

test("unit detail validation sections render only when messages exist", () => {
  assert.equal(validationHasMessages(null), false);
  assert.equal(validationHasMessages({ messages: [] }), false);
  assert.equal(validationHasMessages({ messages: [{ code: "unit.issue", level: "error" }] }), true);
});

test("unit wargear section hides empty scopes unless they carry wargear validation", () => {
  const emptyValidation = { messages: [] };
  const modelTarget = { rosterUnitMiniatureId: "model-1" };

  assert.equal(wargearScopeHasContent([], {}, emptyValidation), false);
  assert.equal(wargearScopeHasContent([{ id: "group-1" }], {}, emptyValidation), true);
  assert.equal(wargearScopeHasContent([], modelTarget, {
    messages: [{
      code: "wargear_loadout.invalid_miniature_wargear_loadout",
      level: "error",
      scope: { targetIds: ["model-1"] },
    }],
  }), true);
  assert.equal(wargearScopeHasContent([], modelTarget, {
    messages: [{
      code: "enhancement.model_does_not_have_required_keywords",
      level: "error",
      scope: { targetIds: ["model-1"] },
    }],
  }), false);
  assert.equal(wargearScopeHasContent([], {}, {
    messages: [{
      code: "wargear_loadout.invalid_wargear_requirement",
      level: "error",
      scope: {},
    }],
  }), true);
});

test("unit wargear model headings include readable model counts", () => {
  assert.equal(miniatureWargearHeading({ count: 1, name: "Abaddon the Despoiler" }), "Abaddon the Despoiler (1 model)");
  assert.equal(miniatureWargearHeading({ count: 10, name: "Cultist" }), "Cultist (10 models)");
});

test("unit wargear section hides when no scopes render", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
    querySelector: () => null,
  };
  const previousCatalog = state.catalog;
  state.catalog = {
    ...previousCatalog,
    wargearGroupsByDatasheetId: new Map(),
  };

  try {
    assert.equal(renderRosterUnitWargearSection({
      roster: {},
      unit: { datasheetId: "datasheet-1", miniatures: [] },
      validation: { messages: [] },
      validationContext: {},
    }), null);
  } finally {
    global.document = previousDocument;
    state.catalog = previousCatalog;
  }
});

test("unit wargear renderer uses flat sections without nested builder-section cards", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
    querySelector: () => null,
  };
  const previousCatalog = state.catalog;
  state.catalog = {
    ...previousCatalog,
    wargearGroupsByDatasheetId: new Map([["datasheet-1", [{
      id: "group-1",
      datasheetId: "datasheet-1",
      miniatureId: "miniature-1",
    }]]]),
  };

  try {
    const section = renderRosterUnitWargearSection({
      roster: {},
      unit: {
        datasheetId: "datasheet-1",
        miniatures: [{ count: 1, miniatureId: "miniature-1", name: "Model" }],
      },
      validation: { messages: [] },
      validationContext: {},
    });
    const scope = renderWargearScope({
      groups: [],
      heading: "Unit Wargear",
      roster: {},
      target: {},
      unit: { datasheetId: "datasheet-1" },
      validation: { messages: [] },
      validationContext: {},
    });

    assert.equal(section.className, "unit-wargear-section");
    assert.equal(section.dataset.unitDetailTarget, "wargear");
    assert.ok(section.textContent.includes("Model (1 model)"));
    assert.equal(scope.className, "wargear-scope");
  } finally {
    global.document = previousDocument;
    state.catalog = previousCatalog;
  }
});

test("unit wargear scope numbers choice headings after default wargear", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
    querySelector: () => null,
  };
  const previousCatalog = state.catalog;
  state.catalog = {
    ...previousCatalog,
    wargearOptionsByGroupId: new Map(),
  };

  try {
    const scope = renderWargearScope({
      groups: [
        { id: "default", instructionText: "Default Wargear" },
        { id: "choice-1", instructionText: "This model's bolt pistol can be replaced." },
        { id: "choice-2", instructionText: "This model's close combat weapon can be replaced." },
      ],
      heading: "Unit Wargear",
      roster: {},
      target: {},
      unit: { datasheetId: "datasheet-1" },
      validation: { messages: [] },
      validationContext: {},
    });
    const nodes = flatNodes(scope);
    const headings = nodes
      .filter((node) => node.className === "wargear-group-title")
      .map((node) => node.textContent);
    const headerMeta = nodes
      .filter((node) => node.className === "section-meta")
      .map((node) => node.textContent);
    const instructions = nodes
      .filter((node) => node.className === "wargear-group-instruction")
      .map((node) => node.textContent);

    assert.deepEqual(headerMeta, []);
    assert.deepEqual(headings, ["Default Wargear", "Choice 1", "Choice 2"]);
    assert.deepEqual(instructions, [
      "This model's bolt pistol can be replaced.",
      "This model's close combat weapon can be replaced.",
    ]);
  } finally {
    global.document = previousDocument;
    state.catalog = previousCatalog;
  }
});
