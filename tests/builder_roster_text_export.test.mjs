import assert from "node:assert/strict";
import test from "node:test";

global.document = {
  querySelector() {
    return null;
  },
};

const { safeExportStem } = await import("../HereticBuilder/static/builder_roster_export_download.js");
const { rosterTextExport } = await import("../HereticBuilder/static/builder_roster_text_export.js");
const { state } = await import("../HereticBuilder/static/builder_state.js");

test("Builder roster text export writes a readable single-roster summary", () => {
  const previousCatalog = state.catalog;
  state.catalog = {
    battleSizeById: new Map([["strike", {
      detachmentPointsLimit: 3,
      name: "Strike Force",
      pointsLimit: 2000,
    }]]),
    detachmentById: new Map([["veterans", {
      id: "veterans",
      detachmentPointsCost: 1,
      name: "Veterans",
    }]]),
    detachmentFactionPointCosts: [],
    factionById: new Map([["ha", { name: "Heretic Astartes" }]]),
    factionKeywordById: new Map(),
    forceDispositionById: new Map([["take", { id: "take", name: "Take and Hold" }]]),
    forceDispositionsByDetachmentId: new Map([["veterans", [{ forceDispositionId: "take" }]]]),
  };

  try {
    assert.equal(safeExportStem("Black Crusade!"), "black-crusade");
    assert.equal(
      rosterTextExport({
        battleSizeId: "strike",
        detachmentIds: ["veterans"],
        factionKeywordId: "ha",
        name: "Black Crusade",
        units: [],
      }),
      [
        "Black Crusade",
        "Heretic Astartes / Strike Force",
        "Points: 0 / 2000",
        "Detachments: 1 / 3 DP",
        "",
        "Detachments (1)",
        "- Veterans (1 DP, Take and Hold)",
        "",
        "Units (0)",
        "- None",
        "",
      ].join("\n")
    );
  } finally {
    state.catalog = previousCatalog;
  }
});
