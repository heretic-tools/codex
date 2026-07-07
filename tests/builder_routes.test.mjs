import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

global.document = { querySelector: () => null };
global.window = { location: { hash: "" } };

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const {
  baseBreadcrumbs,
  builderBreadcrumbs,
  parseRoute,
  rosterBreadcrumbs,
} = await import("../HereticBuilder/static/builder_routes.js");

test("builder route parser keeps optional unit-detail focus targets", () => {
  window.location.hash = "#/roster/roster%201/unit/unit%201/focus/wargear%3Amodel-1";

  assert.deepEqual(parseRoute(), {
    focusTarget: "wargear:model-1",
    name: "unit",
    rosterId: "roster 1",
    unitId: "unit 1",
  });
});

test("builder route parser keeps optional roster-detail focus targets", () => {
  window.location.hash = "#/roster/roster%201/focus/detachments";

  assert.deepEqual(parseRoute(), {
    focusTarget: "detachments",
    name: "roster",
    rosterId: "roster 1",
  });
});

test("builder route parser returns empty focus targets for other routes", () => {
  window.location.hash = "#/roster/roster-1";
  assert.deepEqual(parseRoute(), {
    focusTarget: "",
    name: "roster",
    rosterId: "roster-1",
  });

  window.location.hash = "#/new";
  assert.deepEqual(parseRoute(), {
    focusTarget: "",
    name: "create",
    rosterId: "",
  });
});

test("builder breadcrumbs keep HereticTools pointed at the site root", () => {
  assert.deepEqual(baseBreadcrumbs(), [{ label: "HereticTools", href: "/" }]);
  assert.deepEqual(builderBreadcrumbs(), [
    { label: "HereticTools", href: "/" },
    { label: "Builder", href: "/#/" },
  ]);
});

test("unit-detail breadcrumbs include the parent roster", () => {
  assert.deepEqual(rosterBreadcrumbs({ id: "roster 1", name: "Raid Night" }), [
    { label: "HereticTools", href: "/" },
    { label: "Builder", href: "/#/" },
    { label: "Raid Night", href: "/#/roster/roster%201" },
  ]);
});

test("builder route split modules import shared state before using it", () => {
  const staticDir = join(projectRoot, "HereticBuilder", "static");
  const routeModuleFiles = readdirSync(staticDir)
    .filter((name) => name.startsWith("builder_route_") && name.endsWith(".js"));

  for (const fileName of routeModuleFiles) {
    const source = readFileSync(join(staticDir, fileName), "utf8");
    if (!source.includes("state.")) {
      continue;
    }
    assert.match(
      source,
      /import\s+\{\s*state\s*\}\s+from\s+"\.\/builder_state\.js";/,
      `${fileName} uses state but does not import it`
    );
  }
});
