import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function fakeElement(tagName = "div") {
  const node = {
    attributes: new Map(),
    children: [],
    className: "",
    dataset: {},
    listeners: new Map(),
    tagName,
    textContent: "",
    append(...children) {
      this.children.push(...children);
    },
    addEventListener(name, handler) {
      this.listeners.set(name, handler);
    },
    classList: {
      contains(className) {
        return node.className.split(/\s+/).includes(className);
      },
      toggle(className, enabled) {
        const values = new Set(node.className.split(/\s+/).filter(Boolean));
        if (enabled) {
          values.add(className);
        } else {
          values.delete(className);
        }
        node.className = [...values].join(" ");
      },
    },
    querySelector(selector) {
      if (selector === "[data-favorite-label]") {
        return this.children.find((child) => child.dataset?.favoriteLabel);
      }
      return null;
    },
    replaceChildren(...children) {
      this.children = children;
    },
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  };
  return node;
}

function fakeStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function loadCodexLocal({ classes = ["codex-page", "unit-detail-page"], title = "Jakhals" } = {}) {
  const source = readFileSync(join(projectRoot, "HereticBuilder", "static", "codex-local.js"), "utf8");
  const main = fakeElement("main");
  main.className = classes.join(" ");
  const titleNode = fakeElement("span");
  titleNode.textContent = title;
  const context = {
    URL,
    document: {
      createElement: fakeElement,
      querySelector(selector) {
        if (selector === ".codex-page") {
          return main;
        }
        if (selector === ".app-title-text") {
          return titleNode;
        }
        return null;
      },
      title,
    },
    window: {
      localStorage: fakeStorage(),
      location: {
        href: "https://example.test/faction/world-eaters/datasheet/jakhals/?asset=abc123",
        origin: "https://example.test",
      },
    },
  };
  context.window.window = context.window;
  context.window.document = context.document;
  vm.runInNewContext(source, context);
  return context.window.HereticCodexLocal;
}

test("Codex local library records clean recent page metadata", () => {
  const library = loadCodexLocal();
  const record = library.currentPageRecord();

  assert.equal(record.href, "/faction/world-eaters/datasheet/jakhals/");
  assert.equal(record.title, "Jakhals");
  assert.equal(record.type, "Datasheet");
  assert.equal(typeof record.visitedAt, "number");

  library.rememberRecent(record);
  assert.equal(library.recents().length, 1);
  assert.equal(library.recents()[0].href, "/faction/world-eaters/datasheet/jakhals/");
});

test("Codex local favorite button toggles persisted state", () => {
  const library = loadCodexLocal();
  const record = library.currentPageRecord();
  const button = library.favoriteButton(record);

  assert.equal(button.attributes.get("aria-pressed"), "false");
  assert.equal(button.children[0].textContent, "Save");

  button.listeners.get("click")();
  assert.equal(button.attributes.get("aria-pressed"), "true");
  assert.equal(button.children[0].textContent, "Saved");
  assert.equal(library.favorites()[0].href, record.href);

  button.listeners.get("click")();
  assert.equal(button.attributes.get("aria-pressed"), "false");
  assert.equal(library.favorites().length, 0);
});

test("Codex local library is wired into static templates and build assets", () => {
  const home = readFileSync(join(projectRoot, "HereticBuilder", "templates", "home.html"), "utf8");
  const codex = readFileSync(join(projectRoot, "HereticBuilder", "templates", "codex.html"), "utf8");
  const codexContent = readFileSync(join(projectRoot, "HereticBuilder", "templates", "codex_content.html"), "utf8");
  const buildStaticSite = readFileSync(join(projectRoot, "HereticBuilder", "tools", "build_static_site.py"), "utf8");
  const css = readFileSync(join(projectRoot, "HereticBuilder", "static", "app.css"), "utf8");

  assert.ok(home.includes('data-local-library aria-label="Local Codex library"'));
  assert.ok(home.includes('<script src="/static/codex-local.js" defer></script>'));
  assert.ok(codex.includes('<script src="/static/codex-local.js" defer></script>'));
  assert.ok(codexContent.includes('<script src="/static/codex-local.js" defer></script>'));
  assert.ok(buildStaticSite.includes('"codex-local.js"'));
  assert.ok(css.includes(".favorite-toggle.is-favorite"));
  assert.ok(css.includes(".local-library-empty"));
});
