import assert from "node:assert/strict";
import test from "node:test";

function mockNode() {
  return {
    children: [],
    textContent: "",
    appendChild(node) {
      this.children.push(node);
      this.textContent += node.textContent || "";
      return node;
    },
  };
}

const nodes = new Map([
  ["builder-breadcrumbs", mockNode()],
  ["builder-root", mockNode()],
  ["data-status", mockNode()],
  ["builder-page-title", mockNode()],
]);

global.document = {
  getElementById: (id) => nodes.get(id),
  title: "",
};

const {
  documentTitleFor,
  setPageTitle,
} = await import("../HereticBuilder/static/builder_shell.js");

test("builder document titles keep the root tab concise", () => {
  assert.equal(documentTitleFor("Builder"), "Heretic Builder");
  assert.equal(documentTitleFor(""), "Heretic Builder");
});

test("builder document titles include active roster or unit pages", () => {
  assert.equal(documentTitleFor("Raid Night"), "Raid Night | Heretic Builder");
  assert.equal(documentTitleFor("Abaddon the Despoiler"), "Abaddon the Despoiler | Heretic Builder");
});

test("setting a builder page title updates header and browser title together", () => {
  setPageTitle("Create Roster");

  assert.equal(nodes.get("builder-page-title").textContent, "Create Roster");
  assert.equal(document.title, "Create Roster | Heretic Builder");

  setPageTitle("Builder");

  assert.equal(nodes.get("builder-page-title").textContent, "Builder");
  assert.equal(document.title, "Heretic Builder");
});
