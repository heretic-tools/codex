import assert from "node:assert/strict";
import test from "node:test";

global.document = {
  querySelector: () => null,
};

const {
  renderUnitValidationAction,
  renderRosterValidationActionLink,
  rosterFocusHref,
  rosterFocusTargetForValidationAction,
  scrollToUnitDetailTarget,
  unitFocusHref,
  unitSearchFocusTarget,
} = await import("../HereticBuilder/static/builder_roster_unit_detail_actions.js");

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

function fakeActionElement(tagName) {
  return {
    attributes: new Map(),
    className: "",
    href: "",
    listeners: new Map(),
    tagName,
    textContent: "",
    type: "",
    addEventListener(name, handler) {
      this.listeners.set(name, handler);
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
  };
}

test("unit detail jumps center the first focusable editor control", () => {
  const previousDocument = global.document;
  const previousWindow = global.window;
  const previousCss = global.CSS;
  const calls = [];
  const classList = fakeClassList();
  const focusTarget = {
    focus(options) {
      calls.push(["focus", options]);
    },
    scrollIntoView(options) {
      calls.push(["focus-scroll", options]);
    },
  };
  const section = {
    classList,
    matches() {
      return false;
    },
    querySelector(selector) {
      return selector === "[data-focus-target]" ? focusTarget : null;
    },
    scrollIntoView(options) {
      calls.push(["section-scroll", options]);
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
      return selector === '[data-unit-detail-target="wargear"]' ? section : null;
    },
  };

  try {
    scrollToUnitDetailTarget("wargear");

    assert.deepEqual(calls[0], ["focus-scroll", { behavior: "smooth", block: "center" }]);
    assert.deepEqual(calls[1], ["focus", { preventScroll: true }]);
    assert.equal(calls.some(([name]) => name === "section-scroll"), false);
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

test("unit detail jumps open collapsed disclosures before focusing controls", () => {
  const previousDocument = global.document;
  const previousWindow = global.window;
  const previousCss = global.CSS;
  const calls = [];
  const classList = fakeClassList();
  const disclosure = { open: false };
  const select = {
    focus(options) {
      calls.push(["focus", options]);
    },
    scrollIntoView(options) {
      calls.push(["select-scroll", options]);
    },
  };
  const section = {
    classList,
    matches() {
      return false;
    },
    querySelector(selector) {
      if (selector === "details:not([open])") {
        return disclosure.open ? null : disclosure;
      }
      if (selector === "button, input, select, textarea, a") {
        return disclosure.open ? select : null;
      }
      return null;
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
      return selector === '[data-unit-detail-target="enhancements"]' ? section : null;
    },
  };

  try {
    scrollToUnitDetailTarget("enhancements");

    assert.equal(disclosure.open, true);
    assert.deepEqual(calls[0], ["select-scroll", { behavior: "smooth", block: "center" }]);
    assert.deepEqual(calls[1], ["focus", { preventScroll: true }]);
  } finally {
    global.document = previousDocument;
    global.window = previousWindow;
    global.CSS = previousCss;
  }
});

test("unit detail roster issue links point back to roster editor targets", () => {
  const previousDocument = global.document;
  global.document = {
    createElement(tagName) {
      return fakeActionElement(tagName);
    },
  };

  try {
    assert.equal(
      rosterFocusTargetForValidationAction({ kind: "target", target: "detachments" }),
      "detachments"
    );
    assert.equal(
      rosterFocusTargetForValidationAction({ attribute: "attachment-id", kind: "row" }),
      "attachments"
    );
    assert.equal(rosterFocusHref("roster 1", "detachments"), "#/roster/roster%201/focus/detachments");
    assert.equal(
      unitFocusHref("roster 1", "unit 1", "wargear:model-1"),
      "#/roster/roster%201/unit/unit%201/focus/wargear%3Amodel-1"
    );
    assert.equal(unitSearchFocusTarget("Abaddon the Despoiler"), "unitSearch:Abaddon the Despoiler");

    const detachmentLink = renderRosterValidationActionLink({
      attachmentIds: [],
      code: "roster.detachment_not_selected",
      detachmentIds: [],
      texts: ["Pick a detachment."],
      unitIds: [],
    }, {
      roster: { id: "roster 1" },
      unitById: new Map(),
    });

    assert.equal(detachmentLink.tagName, "a");
    assert.equal(detachmentLink.className, "validation-action-button");
    assert.equal(detachmentLink.textContent, "Detachments");
    assert.equal(detachmentLink.href, "#/roster/roster%201/focus/detachments");
    assert.equal(detachmentLink.title, "Detachments: Pick a detachment.");
    assert.equal(detachmentLink.attributes.get("aria-label"), "Detachments: Pick a detachment.");

    const unitLink = renderRosterValidationActionLink({
      attachmentIds: [],
      code: "unit.max_model_count_too_many_models",
      texts: ["Chosen has too many models."],
      unitIds: ["unit 1"],
    }, {
      roster: { id: "roster 1" },
      unitById: new Map([["unit 1", { id: "unit 1", name: "Chosen" }]]),
    });

    assert.equal(unitLink.textContent, "Open Unit");
    assert.equal(unitLink.href, "#/roster/roster%201/unit/unit%201/focus/composition");
    assert.equal(unitLink.title, "Open unit: Chosen");

    const findLink = renderRosterValidationActionLink({
      attachmentIds: [],
      code: "detachment.datasheets_missing",
      datasheetIds: ["datasheet-1"],
      texts: ["Add Abaddon the Despoiler."],
      unitIds: [],
    }, {
      datasheetById: new Map([["datasheet-1", { name: "Abaddon the Despoiler" }]]),
      roster: { id: "roster 1" },
      unitById: new Map(),
    });

    assert.equal(findLink.textContent, "Find");
    assert.equal(findLink.href, "#/roster/roster%201/focus/unitSearch%3AAbaddon%20the%20Despoiler");
    assert.equal(findLink.title, "Find unit: Abaddon the Despoiler");
  } finally {
    global.document = previousDocument;
  }
});

test("unit detail roster issue actions can focus local editor targets", () => {
  const previousDocument = global.document;
  global.document = {
    createElement(tagName) {
      return fakeActionElement(tagName);
    },
  };

  try {
    const action = renderRosterValidationActionLink({
      attachmentIds: [],
      code: "roster.detachment_not_selected",
      detachmentIds: [],
      texts: ["Pick a detachment."],
      unitIds: [],
    }, {
      localTargets: new Set(["detachments"]),
      roster: { id: "roster 1" },
      unitById: new Map(),
    });

    assert.equal(action.tagName, "button");
    assert.equal(action.type, "button");
    assert.equal(action.className, "validation-action-button");
    assert.equal(action.textContent, "Detachments");
    assert.equal(action.title, "Detachments: Pick a detachment.");
    assert.equal(action.attributes.get("aria-label"), action.title);
    assert.equal(typeof action.listeners.get("click"), "function");
  } finally {
    global.document = previousDocument;
  }
});

test("unit detail roster issue actions pass roster context to target resolver", () => {
  const previousDocument = global.document;
  global.document = {
    createElement(tagName) {
      return fakeActionElement(tagName);
    },
  };

  try {
    const action = renderRosterValidationActionLink({
      attachmentIds: [],
      code: "mandatory_warlord.not_selected",
      detachmentIds: [],
      texts: ["Pick one Warlord."],
      unitIds: [],
    }, {
      roster: { id: "roster 1", units: [] },
      unitById: new Map(),
    });

    assert.equal(action.tagName, "a");
    assert.equal(action.textContent, "Units");
    assert.equal(action.href, "#/roster/roster%201/focus/units");
    assert.equal(action.title, "Units: Pick one Warlord.");
  } finally {
    global.document = previousDocument;
  }
});

test("unit detail detachment requirement actions link back to roster detachments", () => {
  const previousDocument = global.document;
  global.document = {
    createElement(tagName) {
      return fakeActionElement(tagName);
    },
  };

  try {
    const action = renderUnitValidationAction({
      code: "enhancement.required_detachment_missing",
      texts: ["Dark Apotheosis requires the Veterans of the Long War detachment."],
      unitIds: ["unit 1"],
    }, {
      roster: { id: "roster 1" },
    });

    assert.equal(action.tagName, "a");
    assert.equal(action.className, "validation-action-button");
    assert.equal(action.textContent, "Detachments");
    assert.equal(action.href, "#/roster/roster%201/focus/detachments");
    assert.equal(action.title, "Detachments: Dark Apotheosis requires the Veterans of the Long War detachment.");
    assert.equal(action.attributes.get("aria-label"), action.title);
  } finally {
    global.document = previousDocument;
  }
});
