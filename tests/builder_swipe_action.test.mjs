import assert from "node:assert/strict";
import test from "node:test";

import {
  enableSwipeAction,
  swipeActionDistance,
  swipeActionReady,
} from "../HereticBuilder/static/builder_swipe_action.js";

function swipeNode() {
  const listeners = new Map();
  const classes = new Set();
  return {
    classList: {
      add: (name) => classes.add(name),
      contains: (name) => classes.has(name),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      toggle: (name, value) => (value ? classes.add(name) : classes.delete(name)),
    },
    classes,
    listeners,
    setPointerCapture: () => {},
    style: {
      values: new Map(),
      removeProperty(name) {
        this.values.delete(name);
      },
      set transform(value) {
        this.values.set("transform", value);
      },
      get transform() {
        return this.values.get("transform") || "";
      },
    },
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
  };
}

test("swipe action helpers measure leftward distance and readiness", () => {
  assert.equal(swipeActionDistance(120, 80), 40);
  assert.equal(swipeActionDistance(80, 120), 0);
  assert.equal(swipeActionReady(87), false);
  assert.equal(swipeActionReady(88), true);
});

test("swipe action invokes action after a ready touch swipe", async () => {
  const node = swipeNode();
  let called = 0;
  enableSwipeAction(node, async () => {
    called += 1;
  });

  node.listeners.get("pointerdown")({
    clientX: 200,
    clientY: 40,
    pointerId: 1,
    pointerType: "touch",
  });
  node.listeners.get("pointermove")({
    clientX: 90,
    clientY: 42,
    preventDefault: () => {},
  });
  assert.equal(node.classList.contains("is-swipe-ready"), true);

  await node.listeners.get("pointerup")({});

  assert.equal(called, 1);
  assert.equal(node.classList.contains("is-swiping"), false);
  assert.equal(node.style.transform, "");
});

test("swipe action ignores mouse drags", async () => {
  const node = swipeNode();
  let called = 0;
  enableSwipeAction(node, async () => {
    called += 1;
  });

  node.listeners.get("pointerdown")({
    clientX: 200,
    clientY: 40,
    pointerId: 1,
    pointerType: "mouse",
  });
  node.listeners.get("pointermove")({
    clientX: 80,
    clientY: 42,
    preventDefault: () => {},
  });
  await node.listeners.get("pointerup")({});

  assert.equal(called, 0);
});
