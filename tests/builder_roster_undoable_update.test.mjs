import assert from "node:assert/strict";
import test from "node:test";

global.document = { querySelector: () => null };

const { applyRosterUpdate } = await import("../HereticBuilder/static/builder_roster_undoable_update.js");
const { removeDetachmentFromRow } = await import("../HereticBuilder/static/builder_roster_detachment_rows.js");

test("undoable roster updates delegate with previous and next roster snapshots", async () => {
  const previousRoster = { id: "roster-1" };
  const nextRoster = { id: "roster-1", changed: true };
  let fallbackCalled = false;
  let event = null;

  await applyRosterUpdate({
    message: "Changed",
    nextRoster,
    onUndoableUpdate: (value) => {
      event = value;
    },
    onUpdate: () => {
      fallbackCalled = true;
    },
    previousRoster,
  });

  assert.equal(fallbackCalled, false);
  assert.deepEqual(event, {
    message: "Changed",
    nextRoster,
    previousRoster,
  });
});

test("undoable roster updates fall back to normal update without a handler", async () => {
  const nextRoster = { id: "roster-1", changed: true };
  let updated = null;

  await applyRosterUpdate({
    message: "Changed",
    nextRoster,
    onUndoableUpdate: null,
    onUpdate: (value) => {
      updated = value;
    },
    previousRoster: { id: "roster-1" },
  });

  assert.equal(updated, nextRoster);
});

test("detachment removal emits an undoable roster update", async () => {
  const roster = {
    attachments: [],
    detachmentIds: ["detachment-1", "detachment-2"],
    units: [],
  };
  let event = null;

  await removeDetachmentFromRow(
    roster,
    { id: "detachment-1", name: "Pactbound Zealots" },
    0,
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, "Pactbound Zealots removed");
  assert.equal(event.previousRoster, roster);
  assert.deepEqual(event.nextRoster.detachmentIds, ["detachment-2"]);
});
