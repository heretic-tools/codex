import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDatasheets,
  availableDetachments,
  battleSizeNamed,
  datasheetIsCombatPatrol,
  factionNamed,
  keywordIdsForDatasheet,
  realCatalog,
  state,
  validateRoster,
} from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedDetachment,
  rosterWithAddedUnit,
  rosterWithRemovedDetachment,
  rosterWithRemovedUnit,
  unitCanBeAddedToRoster,
} from "../HereticBuilder/static/builder_roster_actions.js";
import { addDetachmentFromControls } from "../HereticBuilder/static/builder_roster_detachment_editor_view.js";
import { addUnitFromControls } from "../HereticBuilder/static/builder_roster_unit_editor_view.js";

function regularDuplicateLimitedDatasheet(roster) {
  const datasheet = availableDatasheets(roster, "native").find((row) => {
    const keywordNames = keywordIdsForDatasheet(row.id)
      .map((id) => realCatalog.keywordById.get(id)?.name)
      .filter(Boolean);
    return !keywordNames.includes("Epic Hero")
      && !keywordNames.includes("Battleline")
      && !keywordNames.includes("Dedicated Transport");
  });
  assert.ok(datasheet, "Expected a non-Epic, non-Battleline, non-Transport native datasheet");
  return datasheet;
}

test("builder roster actions add and remove detachments and default units", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const roster = {
    id: "action-roster",
    name: "Action Roster",
    factionKeywordId: faction.id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };

  const detachment = availableDetachments(faction.id)[0];
  assert.ok(detachment, "Expected an available detachment");
  const withDetachment = rosterWithAddedDetachment(roster, detachment.id);
  assert.deepEqual(withDetachment.detachmentIds, [detachment.id]);
  assert.equal(rosterWithAddedDetachment(withDetachment, detachment.id).detachmentIds.length, 1);
  const combatPatrolDetachmentRow = realCatalog.detachmentFactionKeywords
    .find((row) => realCatalog.detachmentById.get(row.detachmentId)?.isCombatPatrol);
  assert.ok(combatPatrolDetachmentRow, "Expected a Combat Patrol detachment row");
  assert.equal(rosterWithAddedDetachment({
    ...roster,
    factionKeywordId: combatPatrolDetachmentRow.factionKeywordId,
  }, combatPatrolDetachmentRow.detachmentId).detachmentIds.length, 0);
  const factionDetachmentIds = new Set(availableDetachments(faction.id).map((row) => row.id));
  const foreignDetachment = availableDetachments(factionNamed("Adeptus Astartes").id)
    .find((row) => !factionDetachmentIds.has(row.id));
  assert.ok(foreignDetachment, "Expected a detachment unavailable to Heretic Astartes");
  assert.equal(rosterWithAddedDetachment(roster, foreignDetachment.id), roster);

  const datasheet = availableDatasheets(withDetachment, "native")[0];
  assert.ok(datasheet, "Expected an available datasheet");
  const withUnit = rosterWithAddedUnit(withDetachment, {
    datasheetId: datasheet.id,
    unitId: "unit-1",
  });
  assert.equal(withUnit.units.length, 1);
  assert.equal(withUnit.units[0].datasheetId, datasheet.id);
  assert.equal(withUnit.units[0].allyType, "native");
  assert.ok(withUnit.units[0].compositionId);
  assert.ok(withUnit.units[0].miniatures.length > 0);
  assert.ok(withUnit.units[0].miniatures.every((miniature) => miniature.rosterUnitMiniatureId));
  assert.equal(validateRoster(withUnit).messages.some((message) => message.code === "unit.composition_missing"), false);

  const removedUnit = rosterWithRemovedUnit(withUnit, "unit-1");
  assert.deepEqual(removedUnit.units, []);
  const removedDetachment = rosterWithRemovedDetachment(removedUnit, 0);
  assert.deepEqual(removedDetachment.detachmentIds, []);
});

test("builder add controls emit undoable roster updates", async () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const roster = {
    id: "undoable-add-controls-roster",
    name: "Action Roster",
    factionKeywordId: faction.id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const detachment = availableDetachments(faction.id)[0];
  assert.ok(detachment, "Expected an available detachment");
  const datasheet = availableDatasheets(roster, "native")[0];
  assert.ok(datasheet, "Expected an available datasheet");
  let detachmentEvent = null;
  let unitEvent = null;

  await addDetachmentFromControls(
    roster,
    detachment.id,
    detachment.name,
    () => {},
    (value) => {
      detachmentEvent = value;
    }
  );
  await addUnitFromControls({
    label: datasheet.name,
    onUndoableUpdate: (value) => {
      unitEvent = value;
    },
    onUpdate: () => {},
    roster,
    selected: {
      allyType: "native",
      datasheetId: datasheet.id,
    },
    unitId: "unit-1",
  });

  assert.equal(detachmentEvent.message, `${detachment.name} added`);
  assert.equal(detachmentEvent.previousRoster, roster);
  assert.deepEqual(detachmentEvent.nextRoster.detachmentIds, [detachment.id]);
  assert.equal(unitEvent.message, `${datasheet.name} added`);
  assert.equal(unitEvent.previousRoster, roster);
  assert.equal(unitEvent.nextRoster.units[0].datasheetId, datasheet.id);
});

test("builder roster action rejects datasheets unavailable to the roster", () => {
  state.catalog = realCatalog;
  const roster = {
    id: "unavailable-datasheet-action-roster",
    name: "Unavailable Datasheet Action Roster",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const combatPatrolDatasheet = realCatalog.datasheets.find((datasheet) => datasheetIsCombatPatrol(datasheet));
  assert.ok(combatPatrolDatasheet, "Expected a Combat Patrol datasheet");
  assert.equal(rosterWithAddedUnit(roster, {
    datasheetId: combatPatrolDatasheet.id,
    unitId: "combat-patrol-unit",
  }), roster);

  const nativeIds = new Set(availableDatasheets(roster, "native").map((datasheet) => datasheet.id));
  const otherRoster = {
    ...roster,
    factionKeywordId: factionNamed("Adeptus Astartes").id,
  };
  const foreignDatasheet = availableDatasheets(otherRoster, "native")
    .find((datasheet) => !nativeIds.has(datasheet.id));
  assert.ok(foreignDatasheet, "Expected a datasheet unavailable to Heretic Astartes");
  assert.equal(rosterWithAddedUnit(roster, {
    datasheetId: foreignDatasheet.id,
    unitId: "foreign-unit",
  }), roster);
});

test("builder roster action rejects duplicate-limit unit additions", () => {
  state.catalog = realCatalog;
  const roster = {
    id: "duplicate-limit-action-roster",
    name: "Duplicate Limit Action Roster",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const datasheet = regularDuplicateLimitedDatasheet(roster);
  let current = roster;
  for (let index = 0; index < 3; index += 1) {
    current = rosterWithAddedUnit(current, {
      datasheetId: datasheet.id,
      unitId: `duplicate-${index}`,
    });
  }

  assert.equal(current.units.length, 3);
  assert.equal(unitCanBeAddedToRoster(current, {
    allyType: "native",
    datasheetId: datasheet.id,
    compositionId: current.units[0].compositionId,
    miniatures: current.units[0].miniatures,
    wargear: current.units[0].wargear,
  }), false);
  assert.equal(rosterWithAddedUnit(current, {
    datasheetId: datasheet.id,
    unitId: "duplicate-3",
  }), current);
});

test("builder roster action still permits duplicate additions inside the limit", () => {
  state.catalog = realCatalog;
  const roster = {
    id: "inside-duplicate-limit-action-roster",
    name: "Inside Duplicate Limit Action Roster",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const datasheet = regularDuplicateLimitedDatasheet(roster);
  let current = roster;
  for (let index = 0; index < 2; index += 1) {
    current = rosterWithAddedUnit(current, {
      datasheetId: datasheet.id,
      unitId: `inside-limit-${index}`,
    });
  }

  assert.equal(current.units.length, 2);
});
