import assert from "node:assert/strict";
import test from "node:test";

const {
  scrollToUnitDetailTarget,
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
