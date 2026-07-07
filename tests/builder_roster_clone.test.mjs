import assert from "node:assert/strict";
import test from "node:test";

import {
  duplicateRosterDocument,
  duplicateRosterName,
} from "../HereticBuilder/static/builder_roster_clone.js";

test("duplicate roster names are explicit and stable", () => {
  assert.equal(duplicateRosterName("Black Crusade"), "Copy of Black Crusade");
  assert.equal(duplicateRosterName(""), "Copy of New Roster");
});

test("duplicate roster document keeps list contents but gets a new identity", () => {
  const source = {
    id: "roster-1",
    name: "Black Crusade",
    createdAt: "2026-07-01T10:00:00.000Z",
    modifiedAt: "2026-07-02T10:00:00.000Z",
    detachmentIds: ["detachment-1"],
    units: [{ id: "unit-1", datasheetId: "chosen" }],
    attachments: [{ id: "attachment-1", members: [{ rosterUnitId: "unit-1" }] }],
    listSummary: { pointsTotal: 80, validationState: "valid" },
  };

  const copy = duplicateRosterDocument(source, {
    id: "roster-copy",
    now: "2026-07-07T12:00:00.000Z",
  });

  assert.equal(copy.id, "roster-copy");
  assert.equal(copy.name, "Copy of Black Crusade");
  assert.equal(copy.createdAt, "2026-07-07T12:00:00.000Z");
  assert.equal(copy.modifiedAt, "2026-07-07T12:00:00.000Z");
  assert.deepEqual(copy.detachmentIds, ["detachment-1"]);
  assert.deepEqual(copy.units, [{ id: "unit-1", datasheetId: "chosen" }]);
  assert.deepEqual(copy.attachments, [{ id: "attachment-1", members: [{ rosterUnitId: "unit-1" }] }]);

  copy.units[0].datasheetId = "mutated";
  assert.equal(source.units[0].datasheetId, "chosen");
});
