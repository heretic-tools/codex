import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDetachments,
  costForDetachment,
  detachmentDispositionName,
  factionNamed,
  realCatalog,
  state,
} from "./builder_validation_helpers.mjs";
import {
  detachmentCandidateRows,
  detachmentCandidateStatus,
} from "../HereticBuilder/static/builder_roster_detachment_editor_view.js";

test("detachment candidate status explains detachment-point pressure", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const detachment = availableDetachments(faction.id)
    .find((row) => costForDetachment(row.id, faction.id) > 0);
  assert.ok(detachment, "Expected a detachment with a DP cost");
  const cost = costForDetachment(detachment.id, faction.id);
  const roster = {
    factionKeywordId: faction.id,
  };

  assert.deepEqual(
    detachmentCandidateStatus(roster, {
      points: {
        detachmentLimit: 0,
        detachmentPoints: 100,
      },
    }, detachment),
    { severity: "ok", reason: "" }
  );
  assert.deepEqual(
    detachmentCandidateStatus(roster, {
      points: {
        detachmentLimit: 100,
        detachmentPoints: 100,
      },
    }, detachment),
    { severity: "warning", reason: `${cost} DP over` }
  );
});

test("detachment candidate rows filter by name and disposition", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const roster = {
    detachmentIds: [],
    factionKeywordId: faction.id,
  };
  const validation = {
    points: {
      detachmentLimit: 10,
      detachmentPoints: 0,
    },
  };

  const pactbound = detachmentCandidateRows(roster, validation, "pactbound");
  assert.ok(pactbound.length);
  assert.ok(pactbound.every((row) => row.detachment.name.toLowerCase().includes("pactbound")));

  const firstDisposition = detachmentDispositionName(detachmentCandidateRows(roster, validation)[0].detachment);
  assert.ok(firstDisposition);
  const dispositionRows = detachmentCandidateRows(roster, validation, firstDisposition);
  assert.ok(dispositionRows.length);
  assert.ok(dispositionRows.every((row) => detachmentDispositionName(row.detachment) === firstDisposition));
  assert.deepEqual(detachmentCandidateRows(roster, validation, "definitely-no-detachment"), []);
});
