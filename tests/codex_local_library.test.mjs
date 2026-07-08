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
    href: "",
    listeners: new Map(),
    style: {
      values: new Map(),
      getPropertyValue(name) {
        return this.values.get(name) || "";
      },
      setProperty(name, value) {
        this.values.set(name, value);
      },
    },
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
      add(className) {
        const values = new Set(node.className.split(/\s+/).filter(Boolean));
        values.add(className);
        node.className = [...values].join(" ");
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

function fakeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function loadCodexLocal({
  basePath = "",
  classes = ["codex-page", "unit-detail-page"],
  initialStorage = {},
  title = "Jakhals",
  url = "https://example.test/faction/world-eaters/datasheet/jakhals/?asset=abc123",
} = {}) {
  const source = readFileSync(join(projectRoot, "HereticBuilder", "static", "codex-local.js"), "utf8");
  const main = fakeElement("main");
  main.className = classes.join(" ");
  const titleNode = fakeElement("span");
  titleNode.textContent = title;
  const header = fakeElement("div");
  header.className = "app-header faction-hero-title";
  header.style.setProperty("--faction-hero-image", "url('/assets/unit-images/jakhals__example__banner.png')");
  const context = {
    URL,
    document: {
      createElement: fakeElement,
      querySelector(selector) {
        if (selector === 'meta[name="heretic-base-path"]') {
          return { content: basePath };
        }
        if (selector === ".codex-page") {
          return main;
        }
        if (selector === ".app-title-text") {
          return titleNode;
        }
        if (selector === ".app-header.faction-hero-title") {
          return header;
        }
        return null;
      },
      title,
    },
    window: {
      localStorage: fakeStorage(initialStorage),
      location: {
        href: url,
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

  assert.equal(record.href, "/codex/faction/world-eaters/datasheet/jakhals/");
  assert.equal(record.title, "Jakhals");
  assert.equal(record.type, "Datasheet");
  assert.equal(record.imageKind, "unit");
  assert.equal(record.imageUrl, "/assets/unit-images/jakhals__example__banner.png");
  assert.equal(typeof record.visitedAt, "number");

  library.rememberRecent(record);
  assert.equal(library.recents().length, 1);
  assert.equal(library.recents()[0].href, "/codex/faction/world-eaters/datasheet/jakhals/");
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

test("Codex local library links expose readable labels", () => {
  const library = loadCodexLocal();
  const record = library.currentPageRecord();
  const root = fakeElement("div");

  library.rememberRecent(record);
  library.renderLocalLibrary(root);

  assert.equal(library.localLibraryLinkLabel(record), "Open Datasheet: Jakhals");
  const recentSection = root.children[1];
  const recentList = recentSection.children[1];
  const recentLink = recentList.children[0];
  assert.equal(recentLink.className, "local-library-link has-local-image");
  assert.equal(recentLink.href, "/codex/faction/world-eaters/datasheet/jakhals/");
  assert.equal(recentLink.title, "Open Datasheet: Jakhals");
  assert.equal(recentLink.attributes.get("aria-label"), "Open Datasheet: Jakhals");
  assert.equal(recentLink.dataset.imageKind, "unit");
  assert.equal(recentLink.style.getPropertyValue("--background-art"), 'url("/assets/unit-images/jakhals__example__banner.png")');
});

test("Codex local library applies Core Rules art to stored rule links", () => {
  const library = loadCodexLocal({
    initialStorage: {
      hereticCodexFavorites: JSON.stringify([
        {
          href: "/codex/core-rules/rules",
          title: "Rules",
          type: "Codex",
        },
      ]),
    },
  });
  const root = fakeElement("div");

  library.renderLocalLibrary(root);

  const favoriteSection = root.children[0];
  const favoriteList = favoriteSection.children[1];
  const favoriteLink = favoriteList.children[0];
  assert.equal(favoriteLink.className, "local-library-link has-local-image");
  assert.equal(favoriteLink.dataset.imageKind, "faction");
  assert.equal(
    favoriteLink.style.getPropertyValue("--background-art"),
    'url("/assets/faction-images/core-rules__4cdf7a87__roster-header.png")'
  );
  assert.equal(
    library.favorites()[0].imageUrl,
    "/assets/faction-images/core-rules__4cdf7a87__roster-header.png"
  );
});

test("Codex local library canonicalizes legacy root-mounted Codex links", () => {
  const library = loadCodexLocal({
    initialStorage: {
      hereticCodexFavorites: JSON.stringify([
        {
          href: "/faction/heretic-astartes/datasheet/chaos-lord/?asset=old",
          title: "Chaos Lord",
          type: "Datasheet",
        },
      ]),
    },
    title: "Chaos Lord",
    url: "https://example.test/codex/faction/heretic-astartes/datasheet/chaos-lord/?asset=new",
  });
  const record = library.currentPageRecord();
  const button = library.favoriteButton(record);
  const root = fakeElement("div");

  assert.equal(record.href, "/codex/faction/heretic-astartes/datasheet/chaos-lord/");
  assert.equal(library.favorites()[0].href, "/codex/faction/heretic-astartes/datasheet/chaos-lord/");
  assert.equal(button.attributes.get("aria-pressed"), "true");

  library.renderLocalLibrary(root);
  const favoriteSection = root.children[0];
  const favoriteList = favoriteSection.children[1];
  const favoriteLink = favoriteList.children[0];
  assert.equal(favoriteLink.href, "/codex/faction/heretic-astartes/datasheet/chaos-lord/");
});

test("Codex local library renders stored links through the configured base path", () => {
  const library = loadCodexLocal({ basePath: "/builder" });
  const record = library.currentPageRecord();
  const root = fakeElement("div");

  library.rememberRecent(record);
  library.renderLocalLibrary(root);

  const recentSection = root.children[1];
  const recentList = recentSection.children[1];
  const recentLink = recentList.children[0];
  assert.equal(recentLink.href, "/builder/codex/faction/world-eaters/datasheet/jakhals/");
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
  assert.ok(css.includes(".local-library-link.has-local-image"));
});

test("Codex local library links keep mobile touch targets", () => {
  const css = readFileSync(join(projectRoot, "HereticBuilder", "static", "app.css"), "utf8");
  const block = css.match(/\.local-library-link,\n\.local-library-empty \{[^}]+\}/)?.[0] || "";
  const imageBlock = css.match(/\.local-library-link\.has-local-image \{[^}]+\}/)?.[0] || "";

  assert.ok(block.includes("min-height: 44px;"));
  assert.ok(block.includes("touch-action: manipulation;"));
  assert.ok(imageBlock.includes("align-content: end;"));
  assert.ok(imageBlock.includes("padding-top: 15px;"));
  assert.ok(imageBlock.includes("padding-bottom: 6px;"));
  assert.ok(css.includes("background-position: top center;"));
  assert.ok(css.includes("background: var(--app-image-overlay-split);"));
  assert.doesNotMatch(imageBlock, /min-height|height|aspect-ratio/);
});
