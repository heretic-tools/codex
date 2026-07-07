import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { renderNotFoundView } from "../HereticBuilder/static/builder_not_found_view.js";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function createMockElement(tagName) {
  return {
    children: [],
    className: "",
    tagName,
    textContent: "",
    append(...nodes) {
      for (const node of nodes) {
        this.appendChild(node);
      }
    },
    appendChild(node) {
      this.children.push(node);
      this.textContent += node.textContent || "";
      return node;
    },
  };
}

test("not found view relies on breadcrumbs for navigation", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const view = renderNotFoundView();

    assert.equal(view.className, "builder-section");
    assert.equal(view.children.length, 2);
    assert.equal(view.children[0].textContent, "Roster Not Found");
    assert.equal(view.children[1].className, "empty-list");
    assert.equal(view.textContent.includes("Back"), false);
  } finally {
    global.document = previousDocument;
  }
});

test("not found view can describe a missing unit without adding local navigation", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const view = renderNotFoundView({
      message: "This unit is no longer in the roster.",
      title: "Unit Not Found",
    });

    assert.equal(view.children[0].textContent, "Unit Not Found");
    assert.equal(view.children[1].textContent, "This unit is no longer in the roster.");
    assert.equal(view.textContent.includes("Back"), false);
  } finally {
    global.document = previousDocument;
  }
});

test("not found routes title missing roster and unit pages by context", () => {
  const source = readFileSync(
    join(projectRoot, "HereticBuilder", "static", "builder_route_not_found_renderer.js"),
    "utf8"
  );
  const rosterSource = readFileSync(
    join(projectRoot, "HereticBuilder", "static", "builder_route_roster_detail_renderer.js"),
    "utf8"
  );
  const unitSource = readFileSync(
    join(projectRoot, "HereticBuilder", "static", "builder_route_unit_detail_renderer.js"),
    "utf8"
  );

  assert.ok(source.includes("setPageTitle(title)"));
  assert.ok(rosterSource.includes('title: "Roster Not Found"'));
  assert.ok(unitSource.includes('title: "Roster Not Found"'));
  assert.ok(unitSource.includes('title: "Unit Not Found"'));
  assert.ok(unitSource.includes("breadcrumbs: rosterBreadcrumbs(roster)"));
});
