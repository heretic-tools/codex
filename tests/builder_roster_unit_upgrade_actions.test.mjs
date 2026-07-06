import assert from "node:assert/strict";
import test from "node:test";
import {
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
import {
  updateEnhancementFromEditor,
} from "../HereticBuilder/static/builder_roster_unit_enhancement_editor.js";

const ENHANCEMENT_FIXTURES = {
  miniature: {
    datasheetId: "9bc4c7d0-d4dd-4fa4-b77d-d3512b36eae2",
    detachmentId: "12492ec7-0f2c-46fa-822a-80b0c2e8bfd6",
    enhancementId: "994771ac-14b5-40c7-8ade-01bae240edae",
    factionName: "Heretic Astartes",
  },
  unit: {
    datasheetId: "eff3e091-a068-49b7-9a0a-6eb02e546be4",
    detachmentId: "0bb425be-1dff-4825-96ba-704523da27c4",
    enhancementId: "6bb394ee-ecc3-4447-bead-f3d003753b0b",
    factionName: "Adeptus Astartes",
  },
};

function rosterWithFixtureUnit(fixture, detachmentIds = [fixture.detachmentId]) {
  state.catalog = realCatalog;
  const roster = {
    id: "action-roster-upgrades",
    name: "Action Roster",
    factionKeywordId: factionNamed(fixture.factionName).id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds,
    units: [],
    attachments: [],
  };
  const withUnit = rosterWithAddedUnit(roster, {
    datasheetId: fixture.datasheetId,
    unitId: "unit-1",
  });
  assert.equal(withUnit.units.length, 1, "Expected fixture datasheet to be available");
  return { roster: withUnit, unit: withUnit.units[0] };
}

test("builder roster actions write compact enhancement selections", () => {
  const { roster, unit } = rosterWithFixtureUnit(ENHANCEMENT_FIXTURES.unit);
  const withUnitEnhancement = rosterWithUnitEnhancement(roster, unit.id, ENHANCEMENT_FIXTURES.unit.enhancementId);
  assert.deepEqual(withUnitEnhancement.units[0].unitEnhancements, [{ id: ENHANCEMENT_FIXTURES.unit.enhancementId }]);
  assert.deepEqual(rosterWithUnitEnhancement(withUnitEnhancement, unit.id, "").units[0].unitEnhancements, []);

  const miniatureRoster = rosterWithFixtureUnit(ENHANCEMENT_FIXTURES.miniature);
  const targetMiniature = miniatureRoster.unit.miniatures[0];
  const withMiniatureEnhancement = rosterWithMiniatureEnhancement(miniatureRoster.roster, miniatureRoster.unit.id, {
    enhancementId: ENHANCEMENT_FIXTURES.miniature.enhancementId,
    rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
  });
  assert.deepEqual(withMiniatureEnhancement.units[0].miniatureEnhancements, [{
    id: ENHANCEMENT_FIXTURES.miniature.enhancementId,
    targetId: targetMiniature.rosterUnitMiniatureId,
  }]);
  assert.deepEqual(rosterWithMiniatureEnhancement(withMiniatureEnhancement, miniatureRoster.unit.id, {
    enhancementId: "",
    rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
  }).units[0].miniatureEnhancements, []);
});

test("unit enhancement editor emits undoable roster updates", async () => {
  const { roster, unit } = rosterWithFixtureUnit(ENHANCEMENT_FIXTURES.unit);
  let event = null;

  await updateEnhancementFromEditor(
    roster,
    { ...unit, name: "Captain" },
    { targetKind: "unit", targetId: unit.id },
    ENHANCEMENT_FIXTURES.unit.enhancementId,
    {},
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, "Enhancement changed for Captain");
  assert.equal(event.previousRoster, roster);
  assert.deepEqual(event.nextRoster.units[0].unitEnhancements, [{ id: ENHANCEMENT_FIXTURES.unit.enhancementId }]);
});

test("builder roster action derives enhancement context when omitted", () => {
  const unitFixture = ENHANCEMENT_FIXTURES.unit;
  const withoutUnitDetachment = rosterWithFixtureUnit(unitFixture, []);
  const rejectedUnitEnhancement = rosterWithUnitEnhancement(
    withoutUnitDetachment.roster,
    withoutUnitDetachment.unit.id,
    unitFixture.enhancementId
  );
  assert.equal(rejectedUnitEnhancement, withoutUnitDetachment.roster);

  const miniatureFixture = ENHANCEMENT_FIXTURES.miniature;
  const withoutMiniatureDetachment = rosterWithFixtureUnit(miniatureFixture, []);
  const targetMiniature = withoutMiniatureDetachment.unit.miniatures[0];
  const rejectedMiniatureEnhancement = rosterWithMiniatureEnhancement(
    withoutMiniatureDetachment.roster,
    withoutMiniatureDetachment.unit.id,
    {
      enhancementId: miniatureFixture.enhancementId,
      rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
    }
  );
  assert.equal(rejectedMiniatureEnhancement, withoutMiniatureDetachment.roster);
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
