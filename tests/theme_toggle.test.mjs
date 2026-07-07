import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function runThemeScript() {
  const attributes = new Map();
  const storage = new Map();
  const label = { textContent: "" };
  const button = {
    dataset: {},
    listeners: new Map(),
    querySelector(selector) {
      return selector === "[data-theme-toggle-label]" ? label : null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    addEventListener(name, handler) {
      this.listeners.set(name, handler);
    },
  };
  const context = {
    document: {
      documentElement: {
        dataset: {},
        style: {},
      },
      readyState: "complete",
      querySelectorAll(selector) {
        return selector === "[data-theme-toggle]" ? [button] : [];
      },
    },
    window: {
      localStorage: {
        getItem(key) {
          return storage.get(key) || null;
        },
        setItem(key, value) {
          storage.set(key, String(value));
        },
      },
    },
  };
  context.window.document = context.document;
  vm.runInNewContext(
    readFileSync(join(projectRoot, "HereticBuilder", "static", "theme.js"), "utf8"),
    context
  );
  return { attributes, button, context, label, storage };
}

test("theme toggle exposes current state and persists light mode", () => {
  const { attributes, button, context, label, storage } = runThemeScript();

  assert.equal(context.document.documentElement.dataset.theme, "dark");
  assert.equal(context.document.documentElement.style.colorScheme, "dark");
  assert.equal(label.textContent, "Dark");
  assert.equal(attributes.get("aria-label"), "Switch to light theme");
  assert.equal(attributes.get("aria-pressed"), "false");
  assert.equal(button.dataset.themeReady, "true");

  context.window.HereticTheme.toggle();

  assert.equal(context.document.documentElement.dataset.theme, "light");
  assert.equal(context.document.documentElement.style.colorScheme, "light");
  assert.equal(label.textContent, "Light");
  assert.equal(attributes.get("aria-label"), "Switch to dark theme");
  assert.equal(attributes.get("aria-pressed"), "true");
  assert.equal(storage.get("hereticTheme"), "light");
});
