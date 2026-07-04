import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDatasheets,
  availableDetachments,
  battleSizeNamed,
  factionNamed,
  realCatalog,
  state,
  validateRoster,
} from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedDetachment,
  rosterWithAddedUnit,
  rosterWithRemovedDetachment,
  rosterWithRemovedUnit,
  rosterWithUnitComposition,
  rosterWithUnitWargearCount,
} from "../HereticBuilder/static/builder_roster_actions.js";

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

test("builder roster actions update unit composition and scoped wargear", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const roster = {
    id: "action-roster-wargear",
    name: "Action Roster",
    factionKeywordId: faction.id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const datasheet = availableDatasheets(roster, "native")
    .find((row) => (realCatalog.wargearGroupsByDatasheetId.get(row.id) || []).length);
  assert.ok(datasheet, "Expected a datasheet with wargear groups");
  const withUnit = rosterWithAddedUnit(roster, {
    datasheetId: datasheet.id,
    unitId: "unit-1",
  });
  const unit = withUnit.units[0];

  const composition = (realCatalog.compositionsByDatasheetId.get(datasheet.id) || [])
    .find((row) => row.id !== unit.compositionId);
  if (composition) {
    const changed = rosterWithUnitComposition(withUnit, unit.id, composition.id);
    assert.equal(changed.units[0].compositionId, composition.id);
    assert.notDeepEqual(changed.units[0].miniatures, unit.miniatures);
  }

  const group = (realCatalog.wargearGroupsByDatasheetId.get(datasheet.id) || [])
    .find((row) => !row.miniatureId || unit.miniatures.some((miniature) => miniature.miniatureId === row.miniatureId));
  assert.ok(group, "Expected a scoped wargear group");
  const option = (realCatalog.wargearOptionsByGroupId.get(group.id) || [])[0];
  assert.ok(option, "Expected a wargear option");
  const miniature = group.miniatureId
    ? unit.miniatures.find((row) => row.miniatureId === group.miniatureId)
    : null;
  const changedWargear = rosterWithUnitWargearCount(withUnit, unit.id, {
    optionId: option.id,
    count: 2,
    rosterUnitMiniatureId: miniature?.rosterUnitMiniatureId || "",
  });
  if (miniature) {
    const changedMiniature = changedWargear.units[0].miniatures.find((row) => row.rosterUnitMiniatureId === miniature.rosterUnitMiniatureId);
    assert.equal(changedMiniature.wargear[option.id], 2);
  } else {
    assert.equal(changedWargear.units[0].wargear[option.id], 2);
  }
});
