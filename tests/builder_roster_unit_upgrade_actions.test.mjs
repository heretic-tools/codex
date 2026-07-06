import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDatasheets,
  battleSizeNamed,
  factionNamed,
  keywordNamed,
  realCatalog,
  state,
  withCatalog,
} from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedUnit,
  rosterWithMiniatureEnhancement,
  rosterWithUnitEnhancement,
} from "../HereticBuilder/static/builder_roster_actions.js";

function rosterWithNativeUnit() {
  state.catalog = realCatalog;
  const roster = {
    id: "action-roster-upgrades",
    name: "Action Roster",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const datasheet = availableDatasheets(roster, "native")[0];
  assert.ok(datasheet, "Expected an available datasheet");
  const withUnit = rosterWithAddedUnit(roster, {
    datasheetId: datasheet.id,
    unitId: "unit-1",
  });
  return { roster: withUnit, unit: withUnit.units[0] };
}

test("builder roster actions write compact enhancement selections", () => {
  const { roster, unit } = rosterWithNativeUnit();
  const unitEnhancement = realCatalog.enhancements.find((row) => row.enhancementType !== "miniature");
  assert.ok(unitEnhancement, "Expected a unit enhancement");
  const withUnitEnhancement = rosterWithUnitEnhancement(roster, unit.id, unitEnhancement.id);
  assert.deepEqual(withUnitEnhancement.units[0].unitEnhancements, [{ id: unitEnhancement.id }]);
  assert.deepEqual(rosterWithUnitEnhancement(withUnitEnhancement, unit.id, "").units[0].unitEnhancements, []);

  const miniatureEnhancement = realCatalog.enhancements.find((row) => row.enhancementType === "miniature");
  assert.ok(miniatureEnhancement, "Expected a miniature enhancement");
  const targetMiniature = unit.miniatures[0];
  const withMiniatureEnhancement = rosterWithMiniatureEnhancement(roster, unit.id, {
    enhancementId: miniatureEnhancement.id,
    rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
  });
  assert.deepEqual(withMiniatureEnhancement.units[0].miniatureEnhancements, [{
    id: miniatureEnhancement.id,
    targetId: targetMiniature.rosterUnitMiniatureId,
  }]);
  assert.deepEqual(rosterWithMiniatureEnhancement(withMiniatureEnhancement, unit.id, {
    enhancementId: "",
    rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
  }).units[0].miniatureEnhancements, []);
});

test("builder roster action rejects invalid enhancement targets when context is supplied", () => {
  const characterKeywordId = keywordNamed("Character").id;
  const unitEnhancement = {
    id: "action-unit-enhancement",
    name: "Action Unit Enhancement",
    detachmentId: "",
    enhancementType: "unit",
    isEquipableByEpicHero: false,
    isEquipableByNonCharacterUnit: false,
  };
  const miniatureEnhancement = {
    ...unitEnhancement,
    id: "action-miniature-enhancement",
    enhancementType: "miniature",
    name: "Action Miniature Enhancement",
  };
  const catalog = {
    ...realCatalog,
    enhancements: [unitEnhancement, miniatureEnhancement],
    enhancementById: new Map([
      [unitEnhancement.id, unitEnhancement],
      [miniatureEnhancement.id, miniatureEnhancement],
    ]),
    enhancementBodyguardGroupsByEnhancementId: new Map(),
    enhancementBodyguardGroupDatasheetsByGroupId: new Map(),
    enhancementBodyguardGroupKeywordsByGroupId: new Map(),
    enhancementExcludedKeywordsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupFactionsByGroupId: new Map(),
    enhancementRequiredKeywordGroupKeywordsByGroupId: new Map(),
    enhancementRequiredWargearItemsByEnhancementId: new Map(),
  };
  const rosterMiniature = {
    id: "model-1",
    miniatureId: "miniature-1",
    rosterUnitMiniatureId: "model-1",
  };
  const roster = {
    id: "enhancement-guard-roster",
    attachments: [],
    units: [{
      id: "unit-1",
      miniatureEnhancements: [],
      miniatures: [rosterMiniature],
      unitEnhancements: [],
    }],
  };
  const baseUnit = {
    id: "unit-1",
    allyType: "native",
    keywordIds: [],
    miniatures: [{ ...rosterMiniature, count: 1, name: "Line Model" }],
  };
  const characterUnit = {
    ...baseUnit,
    keywordIds: [characterKeywordId],
    miniatures: [{
      ...baseUnit.miniatures[0],
      keywordIds: [characterKeywordId],
    }],
  };

  withCatalog(catalog, () => {
    const rejectedUnitEnhancement = rosterWithUnitEnhancement(roster, "unit-1", unitEnhancement.id, {
      detachments: [],
      keywordIds: [],
      unit: baseUnit,
      units: [baseUnit],
    });
    assert.equal(rejectedUnitEnhancement, roster);

    const acceptedUnitEnhancement = rosterWithUnitEnhancement(roster, "unit-1", unitEnhancement.id, {
      detachments: [],
      keywordIds: [characterKeywordId],
      unit: characterUnit,
      units: [characterUnit],
    });
    assert.deepEqual(acceptedUnitEnhancement.units[0].unitEnhancements, [{ id: unitEnhancement.id }]);
    assert.deepEqual(rosterWithUnitEnhancement(acceptedUnitEnhancement, "unit-1", "", {
      detachments: [],
      keywordIds: [],
      unit: baseUnit,
      units: [baseUnit],
    }).units[0].unitEnhancements, []);

    const rejectedMiniatureEnhancement = rosterWithMiniatureEnhancement(roster, "unit-1", {
      detachments: [],
      enhancementId: miniatureEnhancement.id,
      keywordIds: [],
      miniature: baseUnit.miniatures[0],
      rosterUnitMiniatureId: "model-1",
      unit: baseUnit,
      units: [baseUnit],
    });
    assert.equal(rejectedMiniatureEnhancement, roster);

    const acceptedMiniatureEnhancement = rosterWithMiniatureEnhancement(roster, "unit-1", {
      detachments: [],
      enhancementId: miniatureEnhancement.id,
      keywordIds: [characterKeywordId],
      miniature: characterUnit.miniatures[0],
      rosterUnitMiniatureId: "model-1",
      unit: characterUnit,
      units: [characterUnit],
    });
    assert.deepEqual(acceptedMiniatureEnhancement.units[0].miniatureEnhancements, [{
      id: miniatureEnhancement.id,
      targetId: "model-1",
    }]);
    assert.deepEqual(rosterWithMiniatureEnhancement(acceptedMiniatureEnhancement, "unit-1", {
      detachments: [],
      enhancementId: "",
      keywordIds: [],
      miniature: baseUnit.miniatures[0],
      rosterUnitMiniatureId: "model-1",
      unit: baseUnit,
      units: [baseUnit],
    }).units[0].miniatureEnhancements, []);
  });
});
