import assert from "node:assert/strict";
import test from "node:test";
import {
  detachmentNamed,
  factionNamed,
  realCatalog,
  state,
} from "./builder_validation_helpers.mjs";
import {
  datasheetCodexHref,
  detachmentCodexHref,
  factionCodexHref,
  slugifyName,
} from "../HereticBuilder/static/builder_codex_links.js";

test("builder codex links mirror static codex slug routes", () => {
  state.catalog = realCatalog;
  assert.equal(slugifyName("Emperor’s Children"), "emperors-children");
  assert.equal(factionCodexHref(factionNamed("Heretic Astartes").id), "/faction/heretic-astartes/");
  assert.equal(
    detachmentCodexHref(factionNamed("Heretic Astartes").id, detachmentNamed("Pactbound Zealots").id),
    "/faction/heretic-astartes/detachment/pactbound-zealots/"
  );
  assert.equal(
    datasheetCodexHref(factionNamed("Heretic Astartes").id, realCatalog.datasheets.find((row) => row.name === "Abaddon the Despoiler").id),
    "/faction/heretic-astartes/datasheet/abaddon-the-despoiler/"
  );
});
