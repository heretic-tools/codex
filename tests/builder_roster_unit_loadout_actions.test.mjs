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
import {
  updateWargearCountFromEditor,
} from "../HereticBuilder/static/builder_roster_unit_wargear_options_view.js";
import {
  countControl,
  normalizedCount,
} from "../HereticBuilder/static/builder_roster_unit_wargear_count_control.js";

function createMockElement(tagName) {
  return {
    attributes: new Map(),
    checked: false,
    children: [],
    className: "",
    dataset: {},
    disabled: false,
    listeners: new Map(),
    tagName,
    textContent: "",
    type: "",
    value: "",
    append(...nodes) {
      for (const node of nodes) {
        this.appendChild(node);
      }
    },
    appendChild(node) {
      this.children.push(node);
      return node;
    },
    addEventListener(name, handler) {
      this.listeners.set(name, handler);
    },
    async click() {
      return this.listeners.get("click")?.();
    },
    async dispatch(name) {
      return this.listeners.get(name)?.();
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
  };
}

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

test("unit wargear count control exposes a mobile stepper", async () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const changes = [];
    const control = countControl({
      label: "Plasma gun",
      onChange: (count) => changes.push(count),
      optionRow: { id: "option-1" },
      target: { wargear: { "option-1": 1 } },
    });

    assert.equal(normalizedCount("-4"), 0);
    assert.equal(normalizedCount("2.8"), 2);
    assert.equal(normalizedCount("not-a-number"), 0);
    assert.equal(control.className, "wargear-count-stepper");
    assert.equal(control.children.length, 3);

    const [decrement, input, increment] = control.children;
    assert.equal(decrement.textContent, "-");
    assert.equal(decrement.attributes.get("aria-label"), "Decrease Plasma gun");
    assert.equal(decrement.disabled, false);
    assert.equal(input.type, "number");
    assert.equal(input.value, "1");
    assert.equal(input.attributes.get("aria-label"), "Plasma gun");
    assert.equal(increment.textContent, "+");
    assert.equal(increment.attributes.get("aria-label"), "Increase Plasma gun");

    await increment.click();
    assert.equal(input.value, "2");
    assert.deepEqual(changes, [2]);

    await decrement.click();
    await decrement.click();
    assert.equal(input.value, "0");
    assert.equal(decrement.disabled, true);
    assert.deepEqual(changes, [2, 1, 0]);

    input.value = "-3";
    await input.dispatch("change");
    assert.equal(input.value, "0");
    assert.equal(decrement.disabled, true);
    assert.deepEqual(changes, [2, 1, 0, 0]);
  } finally {
    global.document = previousDocument;
  }
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

test("unit wargear editor emits undoable roster updates", async () => {
  const { datasheet, roster, unit } = rosterWithMultiCompositionUnit();
  const group = (realCatalog.wargearGroupsByDatasheetId.get(datasheet.id) || [])
    .find((row) => !row.miniatureId || unit.miniatures.some((miniature) => miniature.miniatureId === row.miniatureId));
  assert.ok(group, "Expected a scoped wargear group");
  const optionRow = (realCatalog.wargearOptionsByGroupId.get(group.id) || [])[0];
  assert.ok(optionRow, "Expected a wargear option");
  const target = group.miniatureId
    ? unit.miniatures.find((miniature) => miniature.miniatureId === group.miniatureId)
    : unit;
  assert.ok(target, "Expected a wargear target");
  const nextCount = Number((target.wargear || {})[optionRow.id] || 0) ? 0 : 1;
  let event = null;

  await updateWargearCountFromEditor(
    roster,
    unit,
    target,
    optionRow,
    nextCount,
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, `Wargear changed for ${datasheet.name}`);
  assert.equal(event.previousRoster, roster);
  assert.notEqual(event.nextRoster, roster);
});
