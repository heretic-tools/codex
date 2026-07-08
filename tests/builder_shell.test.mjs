import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function projectFile(...parts) {
  return readFileSync(join(projectRoot, ...parts), "utf8");
}

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

test("builder shell clears roster hero art from the classic title bar", () => {
  const header = nodes.get("builder-app-header");
  header.className = "title-bar builder-app-header has-background-art has-roster-hero persistent-class";
  header.style.setProperty("--background-art", 'url("/assets/faction-images/sample.png")');

  clearPageHero();

  assert.equal(header.className, "title-bar builder-app-header persistent-class");
  assert.equal(header.style.getPropertyValue("--background-art"), "");
});

test("builder template uses the classic Codex desktop shell", () => {
  const template = projectFile("HereticBuilder", "templates", "builder.html");

  assert.match(template, /<link rel="stylesheet" href="\/static\/desktop\.css">/);
  assert.match(template, /<main class="desktop codex-page builder-page">/);
  assert.match(template, /class="title-bar builder-app-header"/);
  assert.match(template, /<footer class="taskbar"/);
  assert.match(template, /\/static\/win-scrollbars\.js/);
  assert.doesNotMatch(template, /\/static\/app\.css/);
  assert.doesNotMatch(template, /\/static\/theme\.js/);
  assert.doesNotMatch(template, /theme-toggle/);
});
