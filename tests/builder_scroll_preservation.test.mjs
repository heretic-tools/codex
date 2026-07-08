import assert from "node:assert/strict";
import test from "node:test";

test("builder scroll preservation restores window and rebuilt containers", async () => {
  const stableContainer = {
    id: "builder-root",
    scrollLeft: 4,
    scrollTop: 92,
    scrollTo(left, top) {
      this.scrollLeft = left;
      this.scrollTop = top;
    },
  };
  const indexedContainer = {
    id: "",
    scrollLeft: 0,
    scrollTop: 137,
    scrollTo(left, top) {
      this.scrollLeft = left;
      this.scrollTop = top;
    },
  };
  const rebuiltContainer = {
    id: "builder-root",
    scrollLeft: 0,
    scrollTop: 0,
    scrollTo(left, top) {
      this.scrollLeft = left;
      this.scrollTop = top;
    },
  };
  const rebuiltIndexedContainer = {
    id: "",
    scrollLeft: 0,
    scrollTop: 0,
    scrollTo(left, top) {
      this.scrollLeft = left;
      this.scrollTop = top;
    },
  };
  let queryMode = "capture";
  let windowScroll = null;
  globalThis.window = {
    scrollX: 11,
    scrollY: 243,
    requestAnimationFrame(callback) {
      callback();
    },
    scrollTo(x, y) {
      windowScroll = { x, y };
    },
  };
  globalThis.document = {
    body: {},
    documentElement: {},
    getElementById(id) {
      return id === "builder-root" ? rebuiltContainer : null;
    },
    querySelectorAll() {
      return queryMode === "capture"
        ? [stableContainer, indexedContainer]
        : [rebuiltContainer, rebuiltIndexedContainer];
    },
  };

  const {
    captureBuilderScrollPosition,
    restoreBuilderScrollPosition,
  } = await import("../HereticBuilder/static/builder_scroll_preservation.js");

  const snapshot = captureBuilderScrollPosition();
  queryMode = "restore";
  restoreBuilderScrollPosition(snapshot);

  assert.deepEqual(windowScroll, { x: 11, y: 243 });
  assert.equal(rebuiltContainer.scrollTop, 92);
  assert.equal(rebuiltContainer.scrollLeft, 4);
  assert.equal(rebuiltIndexedContainer.scrollTop, 137);
});
