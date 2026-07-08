import assert from "node:assert/strict";
import test from "node:test";

function mockNode() {
  const node = {
    children: [],
    className: "",
    textContent: "",
    style: {
      values: new Map(),
      getPropertyValue(name) {
        return this.values.get(name) || "";
      },
      removeProperty(name) {
        this.values.delete(name);
      },
      setProperty(name, value) {
        this.values.set(name, value);
      },
    },
    get firstChild() {
      return this.children[0] || null;
    },
    appendChild(node) {
      this.children.push(node);
      this.textContent += node.textContent || "";
      return node;
    },
    removeChild(child) {
      this.children = this.children.filter((item) => item !== child);
      this.textContent = this.children.map((item) => item.textContent || "").join("");
      return child;
    },
  };
  node.classList = {
    remove(...classNames) {
      const remove = new Set(classNames);
      node.className = String(node.className || "")
        .split(/\s+/)
        .filter((className) => className && !remove.has(className))
        .join(" ");
    },
  };
  return node;
}

const nodes = new Map([
  ["builder-breadcrumbs", mockNode()],
  ["builder-app-header", mockNode()],
  ["builder-root", mockNode()],
  ["data-status", mockNode()],
  ["builder-page-title", mockNode()],
]);

global.document = {
  createElement: (tagName) => ({
    children: [],
    className: "",
    tagName,
    textContent: "",
  }),
  getElementById: (id) => nodes.get(id),
  title: "",
};

const {
  clearPageHero,
  documentTitleFor,
  renderStartupError,
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

test("startup errors set explicit Builder error title and status", () => {
  renderStartupError(new Error("Catalog failed"));

  assert.equal(nodes.get("builder-app-header").className.includes("has-background-art"), false);
  assert.equal(nodes.get("builder-page-title").textContent, "Builder Error");
  assert.equal(document.title, "Builder Error | Heretic Builder");
  assert.equal(nodes.get("data-status").textContent, "Error");
  assert.equal(nodes.get("builder-root").children[0].className, "validation-item error");
  assert.equal(nodes.get("builder-root").children[0].textContent, "Catalog failed");
});

test("builder shell clears roster hero art from the shared app header", () => {
  const header = nodes.get("builder-app-header");
  header.className = "app-header builder-app-header has-background-art has-roster-hero persistent-class";
  header.style.setProperty("--background-art", 'url("/assets/faction-images/sample.png")');

  clearPageHero();

  assert.equal(header.className, "app-header builder-app-header persistent-class");
  assert.equal(header.style.getPropertyValue("--background-art"), "");
});
