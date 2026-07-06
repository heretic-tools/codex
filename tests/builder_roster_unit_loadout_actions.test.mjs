import assert from "node:assert/strict";
import test from "node:test";
import {
  availableCompositions,
  availableDatasheets,
  battleSizeNamed,
  compositionFactionIds,
  factionNamed,
  realCatalog,
  state,
} from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedUnit,
  rosterWithUnitComposition,
  rosterWithUnitDefaultWargear,
  rosterWithUnitWargearCount,
} from "../HereticBuilder/static/builder_roster_actions.js";
import {
  updateUnitCompositionFromEditor,
} from "../HereticBuilder/static/builder_roster_unit_composition_editor.js";
import {
  resetWargearFromOverview,
} from "../HereticBuilder/static/builder_roster_unit_overview_view.js";

function rosterWithMultiCompositionUnit() {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const roster = {
    id: "undoable-loadout-roster",
    name: "Undoable Loadout Roster",
    factionKeywordId: faction.id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const datasheet = availableDatasheets(roster, "native")
    .find((row) => availableCompositions(
      row.id,
      compositionFactionIds(roster, "native"),
      roster.detachmentIds || []
    ).length > 1);
  assert.ok(datasheet, "Expected a native datasheet with multiple available compositions");
  const withUnit = rosterWithAddedUnit(roster, {
    datasheetId: datasheet.id,
    unitId: "undoable-unit",
  });
  const unit = withUnit.units[0];
  const composition = availableCompositions(
    datasheet.id,
    compositionFactionIds(roster, "native"),
    roster.detachmentIds || []
  ).find((row) => row.id !== unit.compositionId);
  assert.ok(composition, "Expected an alternate composition");
  return {
    composition,
    datasheet,
    roster: withUnit,
    unit: { ...unit, name: datasheet.name },
  };
}

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

  const composition = availableCompositions(
    datasheet.id,
    compositionFactionIds(roster, "native"),
    roster.detachmentIds || []
  )
    .find((row) => row.id !== unit.compositionId);
  if (composition) {
    const changed = rosterWithUnitComposition(withUnit, unit.id, composition.id);
    assert.equal(changed.units[0].compositionId, composition.id);
    assert.notDeepEqual(changed.units[0].miniatures, unit.miniatures);
  }
  const otherDatasheetComposition = realCatalog.unitCompositions
    .find((row) => row.datasheetId !== unit.datasheetId);
  assert.ok(otherDatasheetComposition, "Expected a composition from another datasheet");
  assert.equal(
    rosterWithUnitComposition(withUnit, unit.id, otherDatasheetComposition.id),
    withUnit
  );
  const requiredDetachmentCompositionRow = realCatalog.compositionRequiredDetachments
    .map((row) => ({
      composition: realCatalog.compositionById.get(row.unitCompositionId),
      row,
    }))
    .find(({ composition }) => (
      composition
      && realCatalog.datasheetFactionKeywords.some((item) => item.datasheetId === composition.datasheetId)
    ));
  assert.ok(requiredDetachmentCompositionRow, "Expected a detachment-required composition");
  const requiredDetachmentFaction = realCatalog.datasheetFactionKeywords
    .find((item) => item.datasheetId === requiredDetachmentCompositionRow.composition.datasheetId);
  const restrictedRoster = {
    id: "restricted-composition-roster",
    factionKeywordId: requiredDetachmentFaction.factionKeywordId,
    detachmentIds: [],
    units: [{
      id: "restricted-composition-unit",
      allyType: "native",
      compositionId: "existing-composition",
      datasheetId: requiredDetachmentCompositionRow.composition.datasheetId,
      miniatureEnhancements: [],
      miniatures: [],
      unitEnhancements: [],
      wargear: {},
    }],
  };
  assert.equal(
    rosterWithUnitComposition(
      restrictedRoster,
      "restricted-composition-unit",
      requiredDetachmentCompositionRow.composition.id
    ),
    restrictedRoster
  );

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
  const otherDatasheetOption = realCatalog.wargearOptions.find((row) => {
    const rowGroup = realCatalog.wargearGroupById.get(row.wargearOptionGroupId);
    return rowGroup && rowGroup.datasheetId !== unit.datasheetId;
  });
  assert.ok(otherDatasheetOption, "Expected a wargear option from another datasheet");
  assert.equal(rosterWithUnitWargearCount(withUnit, unit.id, {
    optionId: otherDatasheetOption.id,
    count: 1,
  }), withUnit);
  const modelOnlyGroup = (realCatalog.wargearGroupsByDatasheetId.get(datasheet.id) || [])
    .find((row) => row.miniatureId && unit.miniatures.some((item) => item.miniatureId === row.miniatureId));
  if (modelOnlyGroup) {
    const modelOnlyOption = (realCatalog.wargearOptionsByGroupId.get(modelOnlyGroup.id) || [])[0];
    assert.ok(modelOnlyOption, "Expected a model-only wargear option");
    assert.equal(rosterWithUnitWargearCount(withUnit, unit.id, {
      optionId: modelOnlyOption.id,
      count: 1,
    }), withUnit);
  }
  const unitOnlyGroup = (realCatalog.wargearGroupsByDatasheetId.get(datasheet.id) || [])
    .find((row) => !row.miniatureId);
  if (unitOnlyGroup && unit.miniatures[0]) {
    const unitOnlyOption = (realCatalog.wargearOptionsByGroupId.get(unitOnlyGroup.id) || [])[0];
    assert.ok(unitOnlyOption, "Expected a unit-level wargear option");
    assert.equal(rosterWithUnitWargearCount(withUnit, unit.id, {
      optionId: unitOnlyOption.id,
      count: 1,
      rosterUnitMiniatureId: unit.miniatures[0].rosterUnitMiniatureId,
    }), withUnit);
  }
  const resetWargear = rosterWithUnitDefaultWargear({
    ...changedWargear,
    units: changedWargear.units.map((row) => row.id === unit.id
      ? {
        ...row,
        miniatures: row.miniatures.map((item, index) => ({
          ...item,
          isWarlord: index === 0,
        })),
      }
      : row),
  }, unit.id);
  assert.deepEqual(resetWargear.units[0].wargear, unit.wargear);
  assert.deepEqual(
    resetWargear.units[0].miniatures.map((row) => row.wargear),
    unit.miniatures.map((row) => row.wargear)
  );
  assert.deepEqual(
    resetWargear.units[0].miniatures.map((row) => row.rosterUnitMiniatureId),
    unit.miniatures.map((row) => row.rosterUnitMiniatureId)
  );
  assert.equal(resetWargear.units[0].miniatures[0].isWarlord, true);
});

test("unit composition editor emits undoable roster updates", async () => {
  const { composition, datasheet, roster, unit } = rosterWithMultiCompositionUnit();
  let event = null;

  await updateUnitCompositionFromEditor(
    roster,
    unit,
    composition.id,
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, `Composition changed for ${datasheet.name}`);
  assert.equal(event.previousRoster, roster);
  assert.equal(event.nextRoster.units[0].compositionId, composition.id);
});

test("unit overview reset wargear emits undoable roster updates", async () => {
  const { datasheet, roster, unit } = rosterWithMultiCompositionUnit();
  let event = null;

  await resetWargearFromOverview(
    roster,
    unit,
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, `Wargear reset for ${datasheet.name}`);
  assert.equal(event.previousRoster, roster);
  assert.equal(event.nextRoster.units[0].id, unit.id);
});
