import assert from "node:assert/strict";
import test from "node:test";

const { scrollToEditorTarget } = await import("../HereticBuilder/static/builder_roster_validation_action_scroll.js");

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

test("editor target jumps center the first focusable control", () => {
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
    dataset: { editorTarget: "units" },
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
      return selector === '[data-editor-target="units"]' ? section : null;
    },
  };

  try {
    scrollToEditorTarget("units");

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
