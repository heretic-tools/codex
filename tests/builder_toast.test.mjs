import assert from "node:assert/strict";
import test from "node:test";

const { dismissToast, showUndoToast } = await import("../HereticBuilder/static/builder_toast.js");

function mockElement(tagName) {
  return {
    attributes: new Map(),
    children: [],
    className: "",
    events: new Map(),
    removed: false,
    tagName,
    textContent: "",
    title: "",
    append(...nodes) {
      this.children.push(...nodes);
    },
    appendChild(node) {
      this.children.push(node);
    },
    addEventListener(name, handler) {
      this.events.set(name, handler);
    },
    remove() {
      this.removed = true;
    },
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  };
}

test("undo toast renders a restore action and dismisses after undo", async () => {
  const previousDocument = global.document;
  const previousWindow = global.window;
  const body = mockElement("body");
  global.document = {
    body,
    documentElement: mockElement("html"),
    createElement: mockElement,
  };
  global.window = {
    clearTimeout: () => {},
    setTimeout: () => 1,
  };

  try {
    let restored = false;
    const toast = showUndoToast({
      message: "Chosen removed",
      onUndo: () => {
        restored = true;
      },
      timeoutMs: 0,
    });

    assert.equal(body.children[0], toast);
    assert.equal(toast.className, "builder-toast undo-toast");
    assert.equal(toast.attributes.get("role"), "status");
    assert.equal(toast.children[0].textContent, "Chosen removed");
    assert.equal(toast.children[1].textContent, "Undo");

    await toast.children[1].events.get("click")();

    assert.equal(restored, true);
    assert.equal(toast.removed, true);
  } finally {
    dismissToast();
    global.document = previousDocument;
    global.window = previousWindow;
  }
});
