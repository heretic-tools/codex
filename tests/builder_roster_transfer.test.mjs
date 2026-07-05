import assert from "node:assert/strict";
import test from "node:test";

import {
  exportRostersPayload,
  parseImportedRosters,
  serializeRosters,
} from "../HereticBuilder/static/builder_roster_transfer.js";

test("Builder roster export payload is versioned and cloned", () => {
  const roster = {
    id: "roster-1",
    factionKeywordId: "faction-1",
    battleSizeId: "size-1",
    detachmentIds: ["detachment-1"],
    units: [{ id: "unit-1" }],
    attachments: [],
  };

  const payload = exportRostersPayload([roster], 879);
  roster.units[0].id = "mutated";

  assert.equal(payload.kind, "heretic-builder-rosters");
  assert.equal(payload.version, 1);
  assert.equal(payload.dataVersion, 879);
  assert.match(payload.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(payload.rosters[0].units[0].id, "unit-1");
});

test("Builder roster import parses only supported roster export files", () => {
  const source = serializeRosters([{
    id: "roster-1",
    name: "Roster",
    factionKeywordId: "faction-1",
    battleSizeId: "size-1",
    detachmentIds: ["detachment-1"],
    units: [{ id: "unit-1" }],
  }], 879);

  const [roster] = parseImportedRosters(source);

  assert.equal(roster.id, "roster-1");
  assert.deepEqual(roster.detachmentIds, ["detachment-1"]);
  assert.deepEqual(roster.units, [{ id: "unit-1" }]);
  assert.deepEqual(roster.attachments, []);
});

test("Builder roster import rejects unsupported or invalid files", () => {
  assert.throws(() => parseImportedRosters("{}"), /Unsupported roster export file/);
  assert.throws(() => parseImportedRosters(serializeRosters([{
    id: "roster-1",
    factionKeywordId: "faction-1",
  }], 879)), /invalid roster/);
});
